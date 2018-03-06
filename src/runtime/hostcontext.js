const VirtualFileSystem = require("./virtfs");
const EventEmitter2     = require("eventemitter2").EventEmitter2;

const JScript_Date          = require("../winapi/Date");
const JScript_WScript       = require("../winapi/WScript");
const JScript_ActiveXObject = require("../winapi/ActiveXObject");

class HostContext {

    constructor(opts) {

	opts = opts || {};

	this.ENVIRONMENT = {
	    UserLevel: "SYSTEM",
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

    get_component(name) {
	return this.components[name];
    }
    
}





/*function HostContext(opts) {

    opts = opts || {};

    var self = this;

    this.mkid = function* () { var i = 0; while (true) yield i++; };

    this._id = this.mkid(); // HostContext is always id#0.
    this.registry = [];

    this.register = function (tag, instance, parent) {
	if (parent === null || parent === undefined) parent = this;
    
	let new_registry_entry = {
	    tag: tag,
	    instance: instance,
	    parent: parent._id
	};

	let reg_entry_idx =  self.registry.push(new_registry_entry) - 1;
	
	self.registry[reg_entry_idx].index = reg_entry_idx

	self.emitter.emit("$DEBUG::component-registered", self.registry[reg_entry_idx]);
	console.log(`REGISTERED ${reg_entry_idx}: ${tag}`);

	return reg_entry_idx;
    };

    this.emitter = opts.emitter || { on: () => {}, emit: () => {} };
    
    this.epoch = opts.epoch || new Date().getTime();
    this.date  = new JS_Date(this);
    
    this.vfs = new VirtualFileSystem(this);

    this.JSAPI = {
        Date              : this.date,
        WScript           : new JS_WScript(this),
        ActiveXObject     : new JS_ActiveXObject(this),
        //FoldersCollection : new JS_FoldersCollection(this),
    };

    return this;
}*/

module.exports = HostContext;
