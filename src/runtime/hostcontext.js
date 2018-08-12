const VirtualFileSystem = require("./virtfs");
const VirtualRegistry   = require("./virtreg");
const EventEmitter2     = require("eventemitter2").EventEmitter2;
const ExceptionHandler = require("../ExceptionHandler");
const JScript_Date          = require("../winapi/Date");
const JScript_Math          = require("../winapi/Math");
const JScript_WScript       = require("../winapi/WScript");
const JScript_ActiveXObject = require("../winapi/ActiveXObject");
const JScript_TextStream    = require("../winapi/TextStream");
const win32path = require("path").win32;
const path = require("path");
const fs   = require("fs");


        /*
	this.ENVIRONMENT = {
            path: "C:\\Users\\Construct",
	    UserLevel: "SYSTEM",
	    Variables: {
		SYSTEM: {
		    // TODO -- These need to be set via a config option.
		    ALLUSERSPROFILE: "C:\\\\ProgramData",
		    APPDATA:"C:\\Users\\User\\AppData\\Roaming",
		    CommonProgramFiles:"C:\\Program Files\\Common Files",
		    COMPUTERNAME:"USR11WIN7",
		    ComSpec: "C:\\Windows\\system32\\cmd.exe",
		    FP_NO_HOST_CHECK:"NO",
		    HOMEDRIVE:"C:",
		    HOMEPATH:"\\Users\\User",
		    LOCALAPPDATA:"C:\\Users\\User\\AppData\\Local",
		    LOGONSERVER:"\\\\USR11WIN7",
		    NUMBER_OF_PROCESSORS:"1",
		    OS:"Windows_NT",
		    Path:"C:\\Python27\\;C:\\Python27\\Scripts;C:\\Windows\\system32;C:\\Windows;C:\\Windows\\" +
			"System32\\Wbem;C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\",
		    PATHEXT:".COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC",
		    PROCESSOR_ARCHITECTURE:"x86",
		    PROCESSOR_IDENTIFIER:"x86 Family 6 Model 158 Stepping 9, GenuineIntel",
		    PROCESSOR_LEVEL:"6",
		    PROCESSOR_REVISION:"9e09",
		    ProgramData:"C:\\ProgramData",
		    ProgramFiles:"C:\\Program Files",
		    PROMPT:"$P$G",
		    PSModulePath:"C:\\Windows\\system32\\WindowsPowerShell\\v1.0\\Modules\\",
		    PUBLIC:"C:\\Users\\Public",
		    SESSIONNAME:"Console",
		    SystemDrive:"C:",
		    SystemRoot:"C:\\Windows",
		    TEMP:"C:\\Users\\User\\AppData\\Local\\Temp",
		    TMP:"C:\\Users\\User\\AppData\\Local\\Temp",
		    USERDOMAIN:"IE11WIN7",
		    USERNAME:"User",
		    USERPROFILE:"C:\\Users\\User",
		    windir:"C:\\Windows"
		},
		USER: {}
	    },
	    CurrentDirectory: "C:\\Windows\\Temp",
	    Services: [],
	    MRU: [], // Most-recently used list; maybe move this to vfs?
	    Arguments: [],
	    BuildVersion: 1,
	    FullName: "C:\\Windows\\System32\\cscript.exe",
	    Name: "Windows Script Host",
	    Path: "C:\\Users\\Construct", // FIXME - this should REALLY be configurable.
	    ScriptFullName: "Full path of the currently running script",
	    ScriptName: "the .js file",
	    StdErr: null,
	    StdIn: null,
	    StdOut: null,
	    Version: 2,
            FileAssociations: {
                "txt": "Text Document",
                "jpg": "JPEG image",
                "js":  "JScript Script File"
            }

	    // TODO:
	    // - processes
	    // - env vars
	    // - hostname
	    // - ip addr?
	 };*/


class HostContext {

    constructor(opts) {

        this.output_buf = [];
        this.hooks = opts.hooks || [];

        // Configuration
        // =============
        this.environment  = opts.config.environment;
        this.current_user = this.environment.whoami   || "john";
        this.hostname     = this.environment.hostname || "CVM-ABC-123";

	this.make_uid = (function () { var i = 0; return () => i++; }());

	// All components (ActiveXObject, WScript.Shell, ...) are
	// expected to register with the `HostContext' when
	// instantiated.  This is not true of so-called "hidden"
	// components, such as those used by Construct behind the
	// scenes.
	this.component_register = [];
	this.components         = {};

	//
	// The emitter is how all events in Construct are passed
	// around.
	this.emitter = opts.emitter || new EventEmitter2({ wildcard: true });
	//
	// Every component has an ID which allows event reconciliation
	// to occur after the JScript code has finished.
	this._id = this.make_uid();
	//
	// The `epoch' value tracks a date (in miliseconds) from when
	// the exact time the script is being run at.  This allows us
	// to change time drastically without hard-coding a date value
	// anywhere.  In the absence of an `opts.epoch' value, we
	// fall-back to using the system's time.
	this.epoch = opts.epoch || new Date().getTime();

        // We need to create the Standard{In,Out,Err} streams, which
        // are just differently configured instances of a TextStream
        // object.
        this.streams = {};

        const NOT_READABLE  = false,
              NOT_WRITEABLE = 0,
              IS_READABLE   = true,
              IS_WRITEABLE  = 1;

        this.streams.stdin = new JScript_TextStream(
            this,
            { stream: "stdin" },
            IS_READABLE,
            NOT_WRITEABLE
        );

        this.streams.stderr = new JScript_TextStream(
            this,
            { stream: "stderr" },
            NOT_READABLE,
            IS_WRITEABLE
        );

        this.streams.stdout = new JScript_TextStream(
            this,
            { stream: "stdout" },
            NOT_READABLE,
            IS_WRITEABLE
        );

	this._setup_components();

        // Create the files specified in the config...
        this._create_filesystem(opts.config.environment.filesystem);
        this._create_registry(opts.config.environment.registry);
    }

    _setup_components () {

	this.components["VirtualFileSystem"] = new VirtualFileSystem(this);
	this.register("VirtualFileSystem", this.components["VirtualfileSystem"]);
	this.vfs = this.components["VirtualFileSystem"];

        this.components["VirtualRegistry"] = new VirtualRegistry(this);
        this.register("VirtualRegistry", this.components["VirtualRegistry"]);
        this.vreg = this.components["VirtualRegistry"];

	// The exception-thrower guards against VM code throwing
	// exceptions without providing sufficient documentation that
	// will help when investigating a sample.  It's accessable
	// from all components, and ensures we get exceptions with
	// vital information, including:
	//
	//   * the component which threw the exception,
	//   * a summary of WHY the exception was thrown,
	//   * and a detailed description to give context.
	//
	this.components["Exceptions"] = new ExceptionHandler(this);
	this.register("Exceptions", this.components["Exceptions"]);
	this.exceptions = this.components["Exceptions"];

	// =============
	// ActiveXObject
	// =============
	this.components["ActiveXObject"] = new JScript_ActiveXObject(this);
	this.register("ActiveXObject", this.components["ActiveXObject"]);

	// =======
	// D A T E
	// =======
	//
	// From JScript, this component is used just as it is in node:
	this.components["Date"] = new JScript_Date(this);
	this.register("Date", this.components["Date"]);

        // ====
        // Math
        // ====
        this.components["Math"] = new JScript_Math(this);
        this.register("Math", this.components["Math"]);

	// =======
	// WScript
	// =======
	this.components["WScript"] = new JScript_WScript(this);
	this.register("WScript", this.components["WScript"]);
    }

    _create_filesystem (filesystem) {

        const vfs  = this.components["VirtualFileSystem"];

        if (filesystem.hasOwnProperty("folders")) {
            filesystem.folders.forEach(dir => {
                vfs.AddFolder(dir);
            });
        }

        if (filesystem.hasOwnProperty("files")) {
            Object.keys(filesystem.files).forEach(fp => {

                const value = filesystem.files[fp];

                // The value signals what kind of file to create.
                // There are three options:
                //
                //  1. If value is FALSE, this means create a blank
                //     file.
                //
                //  2. If value starts with an '@' symbol, it means
                //     "load the file from local disk".
                //
                //  3. If the file doesn't start with an '@' symbol,
                //     the string is the file contents.
                //
                var contents = "";
                if (typeof value === "string") {
                    if (value.startsWith("@")) {
                        let file_to_read = path.resolve(value.replace(/^@/, ""));
                        contents = fs.readFileSync(file_to_read).toString();
                    }
                    else {
                        contents = value;
                    }
                }

                vfs.AddFile(fp, contents);
            });
        }
    }

    _create_registry (registry) {

        const vreg = this.components["VirtualRegistry"];
        Object.keys(registry).forEach(regpath => {
            vreg.write(regpath, registry[regpath]);
        });
    }

    get_hook (obj) {
        return this.hooks.match(obj);
    }


    get_vfs () {
	return this.vfs;
    }


    get_opt (name) {
	// TODO: Add code here which lets runtime code ask questions
	// of the Construct config.
    }

    get_cfg (cfg_item) {
        if (! this.CONFIG.hasOwnProperty(cfg_item)) return null;
        return this.CONFIG[cfg_item];
    }

    get_file_association (filename) {

        const extname = win32path
                  .extname(win32path.basename(filename))
                  .toLowerCase()
                  .replace(".", "");

        if (this.environment.fileassociations.hasOwnProperty(extname)) {
            return this.environment.FileAssociations[extname];
        }

        return `${extname} File`;
    }

    get_env (var_name) {
        if (! this.environment.hasOwnProperty(var_name)) return undefined;
        return this.environment[var_name];
    }

    set_env (key, value) {
        this.environment[key] = value;
    }

    skew_time_ahead_by (ms) {
	this.epoch += ms;
    }

    register (friendly_name, instance, parent) {
	if (parent === null || parent === undefined) parent = this;

	let component_register_entry = {
	    friendly_name: friendly_name,
	    instance:      instance,
	    parent:        parent._id
	};

	// Return the index of the registered component.
	return (this.component_register.push(component_register_entry) - 1);
    }

    get_component(name) {
	return this.components[name];
    }

    write_to_output_buf (...args) {
        this.output_buf.push(args.join(" "));
    }
}

module.exports = HostContext;
