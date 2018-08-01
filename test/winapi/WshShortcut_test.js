const assert = require("chai").assert;
const FSO = require("../../src/winapi/FileSystemObject");
const VirtualFileSystem = require("../../src/runtime/virtfs");

var ctx = null;

function make_FSO (opts) {

    const NOOP = () => {};

    opts = opts || {};

    opts.exceptions  = opts.exceptions  || {};
    opts.environment = opts.environment || {};
    opts.config      = opts.config      || {};
    opts.streams     = opts.streams     || {};

    var default_env = {
        path: "C:\\Users\\Construct"
    };

    var default_cfg = {
        "autovivify": true
    };

    var default_streams = {
        stdin: NOOP,
        stdout: NOOP,
        stderr: NOOP
    };

    let env     = Object.assign({}, default_env,     opts.ENVIRONMENT),
        cfg     = Object.assign({}, default_cfg,     opts.config),
        streams = Object.assign({}, default_streams, opts.streams),
        epoch   = 1234567890;

    let context = {
        epoch: epoch,
        ENVIRONMENT: env,
        CONFIG: cfg,
        emitter: { emit: () => {} },
        exceptions: {},
        vfs: {},
        skew_time_ahead_by: (n) => { this.epoch++ },
        streams: streams,
        get_env: (e) => env[e],
        get_cfg: (c) => cfg[c]
    };

    let new_ctx = Object.assign({}, context, opts);

    let vfs = new VirtualFileSystem(new_ctx);
    new_ctx.vfs = vfs;

    // We set this just so code outside of this function can access
    // the created context object should it need to.
    ctx = new_ctx;

    vfs.AddFolder(ctx.get_env("path"));

    return new FSO(new_ctx);
}

describe("WshShortcut", () => {
    describe(".Arguments", () => {
    });
});
