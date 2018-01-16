const VirtualFileSystem = require("./virtfs");

const JS_Date          = require("../Date");
const JS_WScript       = require("../winapi/WScript");
const JS_ActiveXObject = require("../winapi/ActiveXObject");

function HostContext(opts) {

    opts = opts || {};

    this.epoch       = opts.epoch   || new Date().getTime();
    this.vfs         = opts.vfs     || new VirtualFileSystem();
    this.emitter     = opts.emitter || { on: () => {}, emit: () => {} };
    this.date        = opts.date    || new JS_Date(this.epoch)();

    this.JSAPI = {
        Date          : this.date,
        WScript       : new JS_WScript(this),
        ActiveXObject : new JS_ActiveXObject(this)
    };

    return this;
}


module.exports = HostContext;
