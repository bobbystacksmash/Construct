const VirtualFileSystem = require("./virtfs");

const JS_Date          = require("../Date");
const JS_WScript       = require("../winapi/WScript");
const JS_ActiveXObject = require("../winapi/ActiveXObject");

function HostContext(opts) {

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
}

module.exports = HostContext;
