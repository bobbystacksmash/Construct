const HostContext    = require("./hostcontext");
const fs             = require("fs");
const istanbul       = require("istanbul");
const EventEmitter2  = require("eventemitter2").EventEmitter2;
const urlparse       = require("url-parse");
const vm             = require("vm");
const path           = require("path");
const CodeRewriter   = require("../metaprogramming");
const HookCollection = require("../hooks");
const falafel        = require("falafel");
const beautifier     = require("js-beautify");
const acorn = require("acorn");

const emitter = new EventEmitter2({ wildcard: true }),
      make_id = function () { let x = 1; return () => x++;};

function Runtime (options) {

    this.events = [];

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

    return this;
};


Runtime.prototype.load = function(path_to_file, options) {

    options = options || {};

    this.file_path = path_to_file;

    try {
        this.source = fs.readFileSync(path_to_file).toString();
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

// #########################
// # Capture Coverage Info #
// #########################
Runtime.prototype._capture_coverage_info = function (coverage_obj) {
    console.log(Object.keys(coverage_obj));
    this.coverage = coverage_obj;
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
Runtime.prototype._capture_fnargs = function (arg) {

    try {
        let ast = acorn.parse(arg);
        this.context.emitter.emit("runtime.capture.callexprarg", arg);
    }
    catch (e) {
    }
};

// ################################
// # Capture Function Constructor #
// ################################
Runtime.prototype._capture_function_constructor = function (...args) {

    emitter.emit("runtime.capture.function_constructor", {
        function: [...pargs]
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
};


Runtime.prototype._create_runtime_sandbox = function (source) {

    let context = this.context,
        self = this;

    function __capture__ (input) {



        console.log("HELLO WORLD");

        return input;
    }

    // Instrument the code...
    const rewrite_code = new CodeRewriter(source);
    rewrite_code
        .using("capture fncall", { fn_name: "___capture___" })
        .using("hoist globals") // TODO <---
        .using("beautify");

    // All of the constructable JScript types are set here.

    var sandbox = {
        ___capture___ : this._capture_fnargs.bind(this),
        Date          : context.get_global_object("Date"),
        Math          : context.get_global_object("Math"),
        WScript       : context.get_global_object("WScript"),
        ActiveXObject : context.get_global_object("ActiveXObject")
    };

    // Add the dynamic properties such as one-time names:
    sandbox["collect_coverage_info"] = this._capture_coverage_info;
    sandbox["capture_fnio"]          = (...args) => this._capture_fnio(...args);
    sandbox["capture_eval"]          = (...args) => this._capture_eval(...args);
    sandbox["Function"]              = function (...args) {
        return  self._capture_function_constructor(...args);
    };
    vm.createContext(sandbox);

    let src = rewrite_code.source();

    console.log(src);

    return function () {
        return vm.runInContext(src, sandbox, { "timeout": 2000 });
    }.bind(context);
};



Runtime.prototype._make_runnable = function (mode) {

    mode = mode || "run";

    let events  = this.events,
        epoch   = this.context.epoch,
        ee      = this.context.emitter,
        context = this.context;

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

    ee.on("runtime.capture.fnio", function (event) {
        event.meta = "runtime.capture.fnio";
        events.push(tag_event(event));
    });

    ee.on("runtime.capture.fncallexpr", function (event) {
        console.log("CALLED!!!!!!");
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

    ee.on("runtime.exception.api", function (event) {
        event.meta = "runtime.exception.api";
        console.log("ERR", event);
        events.push(event);
    });

    ee.on("runtime.exception.native", function (event) {
        event.meta = "runtime.exception.native";
        events.push(event);
    });

    let ready_to_run_env = this._create_runtime_sandbox(this.source);

    return function (done) {

        try {
            ready_to_run_env();
            return done(null, { success: true });
        }
        catch (e) {
            if (e.message === "Script execution timed out.") {
                return done(null, { "success": true, "timeout_reached": true });
	    }
            return done(e);
        }
    };

    return this._create_runtime_sandbox(this.source);
};


module.exports = Runtime;
