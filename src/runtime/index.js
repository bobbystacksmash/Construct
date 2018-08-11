const HostContext    = require("./hostcontext");
const fs             = require("fs");
const istanbul       = require("istanbul");
const EventEmitter2  = require("eventemitter2").EventEmitter2;
const urlparse       = require("url-parse");
const vm             = require("vm");
const glob           = require("glob");
const path           = require("path");
const CodeRewriter   = require("../metaprogramming");


function Runtime (options) {
    options = options || {};

    this.events = [];

    this.context = new HostContext({
        emitter : new EventEmitter2({ wildcard: true }),
        epoch   : this.epoch
    });

    this.hooks = [];
    this.load_hooks("./hooks");

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
    const filename = path.basename(path_to_file),
          script_path = `C:\\Users\\Construct\\${filename}`;

    this.context.vfs.AddFile(script_path, this.source_code);
    this.context.set_env("ScriptFullName", script_path);

    return this._make_runnable();
};


Runtime.prototype.load_hooks = function (path_to_hooks_dir) {

    path_to_hooks_dir = path_to_hooks_dir.replace(/\/*$/, "");

    let globpat = `${path_to_hooks_dir}/**/*.js`;

    glob.sync(globpat).forEach(hook_file => {
        try {
            const loaded_file = require(path.resolve(hook_file));
            loaded_file.hooks.forEach(hook => this.context.register_hook(hook, loaded_file.meta));
        }
        catch (e) {
            console.log("Error attempting to load hook:", hook_file);
            console.log("Please remove or fix this file before rerunning.");
            console.log(e.message);
            process.exit(1);
        }
    });
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

    function tag_event (event) {

        const num_props = Object.keys(event).length;
        event.tags = [];

        if (!event.hasOwnProperty("target") && !event.hasOwnProperty("prop")) {
            return event;
        }

        const api_call = `${event.target}.${event.prop}`.toLowerCase(),
              tags     = [
                  { re: /^wshshell\.reg/i, tag: "registry" },
                  { re: /^filesystemobject/i, tag: "filesystem" },
                  { re: /^wshshell\.specialfolders/i, tag: "filesystem" },
                  { re: /^xmlhttprequest/i, tag: "net" },
                  { re: /^adodbstream\.savetofile/i, tag: "filesystem" },
                  { re: /^shell\.application.shellexecute/i, tag: "exec" },
                  { re: /^activexobject.constructor/i, tag: "constructor" },
                  { re: /^adodbstream\.savetofile/i, tag: "filesystem" },

                  { re: /./, tag: "generic" }
              ];

        tags.forEach(tag => {
            if (tag.re.test(api_call)) {
                event.tags.push(tag.tag);
            }
        });

        return event;
    }

    ee.on("**", function (event) {

        if (event.target === undefined) {
            return;
        }

        // We tag events as they come in so we can make better sense
        // of them later.
        events.push(tag_event(event));
    });

    function collect_coverage_info(coverage_obj) {
        self.coverage = coverage_obj;
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
        .using("coverage", { filepath: this.file_path, oncomplete: "collect_coverage_info" })
        .using("beautify");

    // All of the constructable JScript types are set here.
    var sandbox = {
        Date          : context.get_component("Date"),
        Math          : context.get_component("Math"),
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
            vm.runInContext(rewrite_code.source(), sandbox, { "timeout": 200 });
            done(null, { "success": true });
        }
        catch (e) {

	    if (e.message === "Script execution timed out.") {
                done(null, { "success": true, "timeout_reached": true });
                return;
	    }

            done(e);
        }
    };
};


module.exports = Runtime;
