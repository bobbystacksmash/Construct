const HostContext    = require("./hostcontext");
const fs             = require("fs");
const istanbul       = require("istanbul");
const EventEmitter2  = require("eventemitter2").EventEmitter2;
const urlparse       = require("url-parse");
const vm             = require("vm");
const path           = require("path");
const CodeRewriter   = require("../lib/metaprogramming");
const HookCollection = require("../hooks");
const falafel        = require("falafel");
const beautifier     = require("js-beautify");
const acorn          = require("acorn");
const uuid           = require("uuid");
const stack_trace    = require("stack-trace");

// Emitter is not defined as a `this.` property because it may be
// passed to sandbox code which may not resolve `this' correctly.
const emitter = new EventEmitter2({ wildcard: true }),
      make_id = function () { let x = 1; return () => x++;};

function Runtime (options) {

    this.events  = [];
    this.onevent = function () {};

    var self = this;
    const evtpush = this.events.push;
    this.events.push = function (event) {
        emitter.emit("onevent", event);
        evtpush.call(self.events, event);
    };

    this.cover_report = null;

    options = options || {};

    this.config = options.config;

    // Load hooks
    this.hooks = [];
    if (this.config.hasOwnProperty("hooks")) {
        if (this.config.hooks.hasOwnProperty("location")) {
            this.hooks = new HookCollection(path.normalize(this.config.hooks.location));
        }
    }

    this.context = new HostContext({
        emitter: emitter,
        config:  options.config,
        hooks:   this.hooks
    });

    this.fnio = [];
    this.expanders = [];
    this.collect_coverage = false;

    return this;
};


Runtime.prototype.load = function(path_to_file, done, options) {

    options = options || { coverage: false };

    if (options.coverage) {
        this.collect_coverage = true;
    }

    this.file_path = path_to_file;

    try {
        var src = fs.readFileSync(path_to_file).toString();
    }
    catch (e) {
        throw e;
    }

    let generate_identifier = () => {
        return ["__construct", uuid().replace(/-/g, "_"), new Date().getTime()].join("_");
    };

    // Generate unique function names to inject into the source so we
    // can pass data across the sandbox.
    //
    // [ COVERAGE ]
    //
    // We need two identifiers for this:
    //
    //   1. Holds coverage information.
    //   2. Called on-completion of the script, passing #1 back across
    //      the sandbox.
    //
    const cov = {
        variable:   generate_identifier(),
        oncomplete: generate_identifier(),
        filepath:   path.resolve(path_to_file)
    };

    const beautified     = new CodeRewriter(src).using("beautify").source(),
          beautified_cov = new CodeRewriter(beautified).using("coverage", cov).source();

    // Create different versions of the source:
    const capture_fncall  = new CodeRewriter(beautified).using("capture fncall").source(),
          hoisted_globals = new CodeRewriter(beautified).using("hoist globals").source();

    this.source = {
        path: path.resolve(path_to_file),
        original:            src,
        beautified:          beautified,
        beautified_coverage: beautified_cov,
        capture_fncall:      capture_fncall,
        hoisted_globals:     hoisted_globals,
        coverage_info:       cov,
        live: null // <-- the 'live' key is the version of the code
                   // running in the sandbox.
    };

    // We write the input file to the filesystem so the code is able
    // to read itself should it need to.  The code written is the
    // original code, rather than the instrumented version, this is to
    // cater for the case where a self-referencing JScript program is
    // attempting to read code from an exact line offset.
    const filename = path.basename(path_to_file),
          script_path = `C:\\Users\\Construct\\${filename}`;

    this.context.vfs.AddFile(script_path, this.source.original);
    this.context.set_env("ScriptFullName", script_path);

    return this._make_runnable(done);
};

// ########################
// # Capture Function I/O #
// ########################
Runtime.prototype._capture_fnio = function (name, type, value) {

    const obj = {
        name:  name,
        type:  type,
        value: value
    };

    this.context.emitter.emit("runtime.capture.fnio", obj);
    return value;
}

// ##############################
// # Capture Function Call Args #
// ##############################
Runtime.prototype._capture_fnargs = function (callee, loc, arg) {

    if (arg === undefined || arg === null || arg === "") return arg;
    if (Object.keys(arg).length === 0) return arg;

    try {
        let ast = acorn.parse(arg);
        this.context.emitter.emit("runtime.capture.callexprarg", {
            callee: callee,
            arg: arg
        });
    }
    catch (e) {
    }

    return arg;
};

// ###############################
// # Capture the coverage object #
// ###############################
Runtime.prototype._capture_coverage_report = function (coverage_var) {
    var instrumenter = new istanbul.Instrumenter(),
        cover_utils  = istanbul.utils,
        collector    = new istanbul.Collector();

    collector.add(coverage_var);

    this.coverage_report = collector.getFinalCoverage();
};

// ################################
// # Capture Function Constructor #
// ################################
/*Runtime.prototype._capture_function_constructor = function (...args) {

    emitter.emit("runtime.capture.function_constructor", {
        function: [...args]
    });

    // TODO:
    // turn ...args in to a function str -> pass to sandbox.
    let source  = "";

    if (arguments.length === 1) {
        // The Function constructor says that the LAST `arguments'
        // param is the function body, and all params which precede it
        // are the function parameters.

        source = `function SANDBOX () { ${arguments[0]} }`;

    }
    else {

        // All params (except the last) are named fn parameters, which
        // we create here:
        let params_list = Array.prototype.slice.call(arguments),
            fn_body     = params_list.pop(),
            fn_params   = params_list.join(",");

        source = `function SANDBOX (${fn_params}) { ${fn_body} }`;
    }

    return this._create_runtime_sandbox(source);
};*/


/**
 * Prepares a single function which will initiate analysis of a given file.
 *
 * @param {function} resolve Called if analysis completes successfully.
 * @param {function} reject  Called if analysis fails.
 *
 * @returns {function}
 */
Runtime.prototype._create_runtime_sandbox = function (options) {

    options = options || {};

    const default_opts = { coverage: false };
    options = Object.assign(default_opts, options);

    let context = this.context,
        self    = this;

    // All of the constructable JScript types are set here.
    var sandbox = {
        // WINAPI
        // ======
        Date          : context.get_global_object("Date"),
        Math          : context.get_global_object("Math"),
        WScript       : context.get_global_object("WScript"),
        ActiveXObject : context.get_global_object("ActiveXObject")
    };

    const cov_oncomplete = this.source.coverage_info.oncomplete;

    sandbox[cov_oncomplete] = this._capture_coverage_report.bind(this);
    sandbox["capture_fnio"] = (...args) => this._capture_fnio(...args);

    this.source.live = this.source.hoisted_globals;

    if (this.collect_coverage) {
        // For a coverage run we only want to run the the
        // beautified/covered version of the code.
        this.source.live = this.source.beautified_coverage;
    }

    vm.createContext(sandbox);

    return function () {
        return vm.runInContext(self.source.live, sandbox, { "timeout": 2000 });
    }.bind(context);
};

Runtime.prototype.add_event_listener = function (fn) {
    this.onevent = fn;
};


Runtime.prototype._make_runnable = function (done) {

    let events  = this.events,
        epoch   = this.context.epoch,
        ee      = this.context.emitter,
        context = this.context,
        self    = this;

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
                  { re: /^wscript\.createobject/i, tag: "constructor" },
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

    /*ee.on("runtime.capture.fnio", function (event) {
        event.meta = "runtime.capture.fnio";
        events.push(tag_event(event));
     });*/

    ee.on("runtime.capture.callexprarg", function (event) {
        event.meta = "runtime.capture.callexprarg";
        events.push(event);
    });

    ee.on("runtime.capture.eval", function (event) {
        event.meta = "runtime.capture.eval";
        events.push(event);
    });

    ee.on("runtime.capture.function_constructor", function (event) {
        event.meta = "runtime.capture.function_constructor";
        events.push(event);
    });

    ee.on("runtime.api.*", function (event) {
        event.meta = "runtime.api.call";
        events.push(event);
    });

    ee.on("runtime.exception", function (err) {

        const stack  = stack_trace.parse(err),
              errevt = {
                  stack: stack,
                  message: err.message,
                  last_prop: null,
                  sandbox_stacktrace: []
              };

        // When errors are thrown within the v8 sandbox the first
        // object's .fileName property says that it's the evalmachine.
        if (stack.length) {

            // The only important parts of the exception are those
            // thrown within the evalmachine, so let's grab them.
            let sbox_trace = stack.reduce((errs, err) => {

                if (err && err.hasOwnProperty("fileName") && /^evalmachine\./i.test(err.fileName)) {
                    errs.push(err);
                }
                return errs;
            }, []);

            if (sbox_trace.length) {

                let srcloc = self.source.live.split(/\r?\n/g);
                sbox_trace.forEach((err) => {
                    err.offendingLine = srcloc[err.lineNumber - 1];
                });
            }

            errevt.sandbox_stacktrace = sbox_trace;

            // It's likely that one of the last attempted API methods
            // is what caused the failure.  Let's fetch the last one
            // as information to our user.
            let last_requested_prop = events.filter(evt => evt.meta === "debug.getprop");

            if (last_requested_prop.length) {
                errevt.last_prop = last_requested_prop.pop();
            }
        }

        errevt.meta = "runtime.exception";
        events.push(errevt);
    });

    ee.on("runtime.exception.native", function (event) {
        event.meta = "runtime.exception.native";
        events.push(event);
    });

    ee.on("debug.getprop", function (event) {
        event.meta = "debug.getprop";
        events.push(event);
    });

    ee.on("finished", function (event) {
        event.meta = "finished";
        events.push(event);
    });

    ee.on("onevent", function (event) {
        self.onevent(event, done);
    });

    return () => {

        let ready_to_run = this._create_runtime_sandbox();

        try {
            ready_to_run();
            ee.emit("finished", { success: true });
        }
        catch (e) {
            if (e.message === "Script execution timed out.") {
                ee.emit("finished", { success: true, "timeout_reached": true });
                resolve({ success: true, timeout: true });
	    }
            else {
                reject(e);
            }
        }
    };
};

module.exports = Runtime;
