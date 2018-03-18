const VirtualFileSystem = require("./virtfs");
const EventEmitter2     = require("eventemitter2").EventEmitter2;

const ExceptionHandler = require("../ExceptionHandler");

const JScript_Date          = require("../winapi/Date");
const JScript_WScript       = require("../winapi/WScript");
const JScript_ActiveXObject = require("../winapi/ActiveXObject");

class HostContext {

    constructor(opts) {

	opts = opts || {};

	this.user_agent = "Mozilla/4.0 (compatible; MSIE 7.0; Windows " +
	    "NT 6.1; Trident/7.0; SLCC2; .NET CLR 2.0.50727; " +
	    ".NET CLR 3.5.30729; .NET CLR 3.0.30729; " +
	    "Media Center PC 6.0; .NET4.0C)";
	
	this.hooks = {
	    network: []
	};

	// TODO
	// This is hacky. Need to fix it.
	this.output_behaviour = "repl";

	this.ENVIRONMENT = {
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
	    Name: "FIXME_NAME_PROP",
	    Path: "Echo CWD",
	    ScriptFullName: "Full path of the currently running script",
	    ScriptName: "the .js file",
	    StdErr: null,
	    StdIn: null,
	    StdOut: null,
	    Version: 2
	    
	    // TODO:
	    // - processes
	    // - env vars
	    // - hostname
	    // - ip addr?
	};

	this.make_uid = function* () { var i = 0; while (true) yield i++; };

	// All components (ActiveXObject, WScript.Shell, ...) are
	// expected to register with the `HostContext' when
	// instantiated.  This is not true of so-called "hidden"
	// components, such as those used by Construct behind the
	// scenes.
	this.component_register = [];

	this.components = {};
	
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

	this._setup_components();
	
    }

    _setup_components () {

	// The exception-thrower is an guard against VM code throwing
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

	// =======
	// WScript
	// =======
	this.components["WScript"] = new JScript_WScript(this);
	this.register("WScript", this.components["WScript"]);
    }


    get_opt (name) {
	// TODO: Add code here which lets runtime code ask questions
	// of the Construct config.
	
    }


    register (friendly_name, instance, parent) {
	if (parent === null || parent === undefined) parent = this;

	let component_register_entry = {
	    friendly_name: friendly_name,
	    instance:      instance,
	    parent:        parent._id
	};

	this.emitter.emit("$DEBUG::component-registered", component_register_entry);

	// Return the index of the registered component.
	return (this.component_register.push(component_register_entry) - 1);
    }


    add_network_hook(description, method, addr, response_handler) {

	if (! this.hooks.network.hasOwnProperty(method)) {
	    this.hooks.network[method] = [];
	}
	
	this.hooks.network[method].push({
	    match: (a) => (addr instanceof RegExp) ? addr.test(a) : a.includes(addr),
	    desc: description,
	    handle: response_handler
	});
    }


    get_network_hook(method, addr) {

	//
	// Default hook
	// ============
	//
	// We return the default hook if no user-supplied hook can be found.
	//
	let default_nethook = {
	    match: () => true,
	    desc:  "Construct's default nethook response handler.",
	    handle: (req, ee) => {
		return {
		    status: 200, // TODO: Fetch this value from the config.
		    body: `<!DOCTYPE html><html><head></head><body>Construct.</body></html>`
		};
	    }
	};

	method = method.toUpperCase();
	
	if (!this.hooks.network.hasOwnProperty(method)) {
	    return default_nethook;
	}

	
	let hook = this.hooks.network[method].find((hook) => hook.match(addr));

	if (!hook) {
	    return default_nethook;
	}

	return hook;
    }


    get_component(name) {
	return this.components[name];
    }
}

module.exports = HostContext;
