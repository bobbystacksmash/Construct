const HostContext    = require("./hostcontext");
const fs             = require("fs");
const istanbul       = require("istanbul");
const EventEmitter2  = require("eventemitter2").EventEmitter2;
const urlparse       = require("url-parse");
const vm             = require("vm");
const glob           = require("glob");
const path           = require("path");
const CodeRewriter   = require("../../lib/metaprogramming");


function Runtime (options) {
    options = options || {};

    this.events = [];

    this.context = new HostContext({
        emitter : new EventEmitter2({ wildcard: true }),
        epoch   : this.epoch
    });

    this.load_plugins("./plugins");

    return this;
}


Runtime.prototype.load = function(path_to_file, options) {

    options = options || {};

    this.file_path = path_to_file;

    try {
        this.source_code = fs.readFileSync(path_to_file).toString();
    }
    catch (e) {
        throw e;
    }

    // We write the input file to the filesystem so the code is able
    // to read itself should it need to.  The code written is the
    // original code, rather than the instrumented version, this is to
    // cater for the case where a self-referencing JScript program is
    // attempting to read code from an exact line offset.
    const filename = path.basename(path_to_file);
    this.context.vfs.AddFile(`C:\\Users\\Construct\\${filename}`, this.source_code);

    return this._make_runnable();
};


Runtime.prototype.load_plugins = function (path_to_plugins_dir) {

    let plugins_load_path    = path_to_plugins_dir.replace(/\/*$/, ""),
	plugins_glob_pathpat = `${plugins_load_path}/**/index.js`,
	found_plugins_files  = glob.sync(plugins_glob_pathpat);

    console.log(`Plugin loader will attempt to read plugins from "${path_to_plugins_dir}".`);
    console.log(`Plugin loader found ${found_plugins_files.length}`,
		`${found_plugins_files.length === 1 ? "plugin" : "plugins"}.`);

    function network_hook (description, method, addr, response_fn) {
	this.context.add_network_hook(description, method, addr, response_fn);
    };

    function registry_hook (description, method, matcher, callback) {
        this.context.add_registry_hook(description, method, matcher, callback);
    }

    const hooks = {
	network:  network_hook.bind(this),
        registry: registry_hook.bind(this)
    };

    // Loop-over all of the
    found_plugins_files.forEach((plugin_file) => {

	let this_plugin = require(path.resolve(plugin_file)),
	    plugin_dir  = path.basename(path.parse(plugin_file).dir);

	let plugin_info = {};

	plugin_info.description = this_plugin.description || "No description.",
	plugin_info.author      = this_plugin.author      || "Unknown author.",
	plugin_info.version     = this_plugin.version     || "0.0.0";

	if (!this_plugin.onload || ! this_plugin.onload instanceof Function) {
	    console.log(`Plugin loader failed to load ${plugin_dir} plugin ("${plugin_info.description}")`,
			`plugin does not export an 'onload' function.`);
	    return;
	}

	try {
	    this_plugin.onload.call(this.context, hooks);
	}
	catch (e) {
	    console.log(`Plugin loader failed to load ${plugin_dir}: ${e.message}`);
	    return;
	}

	//
	// Success! Plugin has been registered.
	//
	console.log(`Plugin loader loaded "${plugin_dir}" (${plugin_info.version})`,
		    `-- "${plugin_info.description}"`);

    }, this);

    console.log("\n");
};


Runtime.prototype._make_runnable = function () {

    let events            = this.events,
        epoch             = this.context.epoch,
        ee                = this.context.emitter,
        context           = this.context;

    // ############
    // # Coverage #
    // ############
    var instrumenter = new istanbul.Instrumenter(),
        cover_utils  = istanbul.utils,
        collector    = new istanbul.Collector();

    var self = this;

    function collect_coverage_info(coverage_obj) {

        collector.add(coverage_obj);

        let key        = collector.files()[0],
            cov_report = {
                filename: key,
                report:   cover_utils.summarizeFileCoverage(collector.fileCoverageFor(key))
            };

        self.coverage = cov_report;
    };

    // ################
    // # Capture Eval #
    // ################
    function capture_eval (evalarg) {
        ee.emit("capture eval", evalarg);
        return evalarg;
    }

    // Instrument the code...
    const rewrite_code = new CodeRewriter(this.source_code);
    rewrite_code
        .using("capture eval", { fn_name: "capture_eval" })
        .using("hoist globals")
        .using("coverage", { oncomplete: "collect_coverage_info" })
        .using("beautify");

    // All of the constructable JScript types are set here.
    var sandbox = {
        Date          : context.get_component("Date"),
        WScript       : context.get_component("WScript"),
        ActiveXObject : context.get_component("ActiveXObject"),
        console       : console
    };

    // Add the dynamic properties such as one-time names:
    sandbox["collect_coverage_info"] = collect_coverage_info;
    sandbox["capture_eval"]          = capture_eval;

    vm.createContext(sandbox);

    return function (done) {
        try {
            vm.runInContext(rewrite_code.source(), sandbox, { "timeout": 2000 });
            done(null, { "success": true });
        }
        catch (e) {

	    if (e.message === "Script execution timed out.") {
	        // TODO...
	    }
	    else {
	        console.log(e);
	    }

            done(e);
        }
    };
};


Runtime.prototype._filter_interesting_events  = function () {

    // Collect high-severity events
    let high_severity_events = this.events
        .filter((e) => {
            switch (e.event) {
                case "WINAPI.ActiveXObject.new.WScript.Shell":
                case "WINAPI.XMLHttpRequest.open":
                case "WINAPI.ADODB.SaveToFile":
                case "WINAPI.ADODB.Write":
                    return true;
                default:
                    return false;
            }
        })
        .map((e) => {
            return {
                esrc: e.event,
                summary: "Summary for why this event is bad...",
                link_to_docs: "http://msdn.com/link/to/docs"
            };
        });

    // Collect URLs
    let url_based_events = this.events
        .filter((e) => /(?:^WINAPI\.XMLHttpRequest\.send)$/.test(e.event))
        .map((e)    => {

            let url    = urlparse(e.args.url),
                domain = url.host,
                safeish_domain = url.host.replace(/\./g, "[.]");

            return {
                url:         e.args.url,
                safe_url:    e.args.safeish_url,
                domain:      url.host,
                safe_domain: safeish_domain,
                esrc:        e.event
            };
        });

    return {
        severity: {
            high:   high_severity_events,
            medium: [],
            low:    []
        },
        url: url_based_events
    };
};

module.exports = Runtime;
