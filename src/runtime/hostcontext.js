const VirtualFileSystem = require("./virtfs");

const JS_Date          = require("../Date");
const JS_WScript       = require("../winapi/WScript");
const JS_ActiveXObject = require("../winapi/ActiveXObject");

function HostContext(opts) {

    opts = opts || {};

    this.epoch       = opts.epoch   || new Date().getTime();
    this.date        = opts.date    || new JS_Date(this.epoch)();
    this.emitter     = opts.emitter || { on: () => {}, emit: () => {} };
    this.vfs         = opts.vfs     || new VirtualFileSystem({ date: this.date, emitter: this.emitter });


    this.JSAPI = {
        Date              : this.date,
        WScript           : new JS_WScript(this),
        ActiveXObject     : new JS_ActiveXObject(this),
        //FoldersCollection : new JS_FoldersCollection(this),
    };

    return this;
}


module.exports = HostContext;
