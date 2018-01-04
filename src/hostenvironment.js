
// TODO:
// import virtual filesystem
// import virtual tasklist

const evts = require("./events");
const VFS  = require("./vfilesys");

module.exports = function HostEnvironment (opts) {

    let emitter = opts.emitter || {},
        vfs     = new VFS({ emitter: emitter });

    // PUBLIC API
    // ==========
    return {
        fs: vfs
    }
};
