const HostContext    = require("./hostcontext");
const detect_globals = require("acorn-globals");
const fs             = require("fs");
const istanbul       = require("istanbul");
const EventEmitter2  = require("eventemitter2").EventEmitter2;
const urlparse       = require("url-parse");
const vm             = require("vm");


var instrumenter = new istanbul.Instrumenter(),
    cover_utils  = istanbul.utils,
    collector    = new istanbul.Collector();


function Runtime (options) {
    options = options || {};

    this.events         = [];
    this.assembled_code = null;

    this.ctx = new HostContext({
        emitter : new EventEmitter2({ wildcard: true }),
        epoch   : this.epoch,

    });


    return this;
}


Runtime.prototype.load = function(path_to_file, options) {

    options = options || {};

    this.file_path         = path_to_file;
    this.instrumented_code = null;

    try {
        this.file_contents = fs.readFileSync(path_to_file).toString();
    }
    catch (e) {
        throw e;
    }

    this._instrument_code(this.file_contents);
    this._assemble_runnable();

    // We now have `this.assembled_code`, which holds code that's ready to run, but
    // in order to do so, it needs its support scaffolding (the real magic).  Let's
    // add all of that now...
    return this._make_runnable();
}


Runtime.prototype._make_runnable = function () {

    console.log("EMITTER");
    console.log(this.ctx.emitter);

    let events            = this.events,
        assembled_code    = this.assembled_code,
        completed_fn_name = this.instrumented_code.completed_fn_name,
        epoch             = this.ctx.epoch,
        ee                = this.ctx.emitter,
        ctx               = this.ctx;

     ee.on("**", function (x) {

        if (this.event.startsWith("DEBUG") || this.event.startsWith("Report")) {
            return;
        }

        events.push({ 
            event: this.event, 
            args: x, 
            t: new Date().getTime() 
        });
    });

    var self = this;

    return function (done) {

        function script_finished(x) {

            collector.add(x);

            let key = collector.files()[0];

            let coverage_report = {
                filename: key,
                report: cover_utils.summarizeFileCoverage(collector.fileCoverageFor(key))
            };

            self.coverage           = coverage_report;
            self.interesting_events = self._filter_interesting_events();

            done();
        }

        var sandbox = {
            Date          : ctx.JSAPI.Date,
            WScript       : ctx.JSAPI.WScript,
            ActiveXObject : ctx.JSAPI.ActiveXObject,
        };
        sandbox[completed_fn_name] = script_finished;

        vm.createContext(sandbox);
        vm.runInContext(assembled_code, sandbox);

        /*let fn = new Function("Array", "Date", "WScript", "ActiveXObject", completed_fn_name, assembled_code);
        fn(Array, date, WScript, ActiveXObject, script_finished);*/
    };
}


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
            }
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
            }
        });

    return {
        severity: {
            high:   high_severity_events,
            medium: [],
            low:    []
        },
        url: url_based_events,
    };
}



Runtime.prototype._instrument_code = function (code_file_contents) {

    let covered_code         = this._instrument_inject_coverage(code_file_contents),
        hoisted_globals_code = this._instrument_hoist_global_defs(covered_code);

    this.instrumented_code = {
        covered_code      : covered_code,
        hoisted_globals   : hoisted_globals_code,
        completed_fn_name : `___cstruct_completed_${new Date().getTime()}` // Needs thought.
    };
}


Runtime.prototype._assemble_runnable = function () {

    let inscode = this.instrumented_code;

    // The outline of the code we run should look like this:
    //
    // +------------------+
    // |                  |
    // |  var foo;        | Hoisted globals, detected
    // |  var bar;        | and added by the instrumenter.
    // |                  |
    // |  debugger;       | Debugger statement, injected
    // |                  | for use with the debugger.
    // |                  |
    // |  <<code>>        | Code, as loaded from disk with
    // |                  | all coverage info added.
    // |                  |
    // |  done(coverage); | Added by us to be called at
    // |                  | the end of script-exec so we
    // +------------------+ can capture coverage information.
    //
    // Let's assemble the code we'll eventually run, starting
    // with globals.
    let assembled_code = inscode.hoisted_globals;
    //
    // Now let's add in the debugger...
    //
    assembled_code += `\n\ndebugger;\n\n`;
    //
    // ...and now our heavily instrumented coveraged code...
    //
    assembled_code += inscode.covered_code;
    //
    // ...finally, the function call we use to grab coverage
    // info and bring it back to something we can analyse.
    assembled_code += `\n\n${inscode.completed_fn_name}(__coverage__);`;

    this.assembled_code = assembled_code;
}




Runtime.prototype._instrument_hoist_global_defs = function(code) {

    // JScript treats these variables as global (non-strict JS).  As
    // we always run in strict mode, we clean-up these globals, and
    // declare them at the top-level using `var`.
    const reserved_globals = [
        "Function",
        "ActiveXObject",
        "eval",
        "this",
        "String",
        "parseInt",
        "RegExp",
        "Array",
        "Date",
        "WScript"
    ];

    let reserved_globals_RE     = new RegExp("^(?:" + reserved_globals.join("|") + ")$"),
        list_of_all_globals     = detect_globals(code),
        unreserved_globals      = [];

    list_of_all_globals
        .filter((g) => !reserved_globals_RE.test(g.name))          // Filter out reserved globals...
        .map((g) => unreserved_globals.push(`var ${g.name};`)); // Anything that's left gets var'd.

    return unreserved_globals.join("\n");
}




Runtime.prototype._instrument_inject_coverage = function (code, options) {
    options = options || {};

    let covered_code = instrumenter.instrumentSync(code, this.file_path);

    return covered_code;
}


module.exports = Runtime;
