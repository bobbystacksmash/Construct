
// TODO:
// import virtual filesystem
// import virtual tasklist

const VFS = require("./vfilesys");

module.exports = function HostEnvironment (opts) {

    let emitter = opts.emitter || {};


    // PUBLIC API
    // ==========
    return {
        fs: new VFS({ emitter: emitter })
    }
};
