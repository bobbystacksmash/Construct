const assert            = require("chai").assert;
const Folder            = require("../../src/winapi/FolderObject");
const VirtualFileSystem = require("../../src/runtime/virtfs");

var ctx = null;

function make_vfs (opts) {

    opts = opts || {};

    opts.exceptions  = opts.exceptions  || {};
    opts.environment = opts.environment || {};
    opts.config      = opts.config      || {};

    var default_env = {
        path: "C:\\Users\\Construct"
    };

    var default_cfg = {
        "autovivify": true
    };


    let env   = Object.assign({}, default_env, opts.environment),
        cfg   = Object.assign({}, default_cfg, opts.config),
        epoch = opts.epoch || 1234567890;

    let context = {
        epoch: epoch,
        ENVIRONMENT: env,
        CONFIG: cfg,
        emitter: { emit: () => {} },
        get_env: (e) => env[e],
        get_cfg: (c) => cfg[c]
    };

    ctx = null;
    ctx = Object.assign({}, context, opts);

    return new VirtualFileSystem(ctx);
}

describe("FolderObject", () => {

    describe("Object creation", () => {

        it("should support being created from an existing VFS path", () => {

            const vfs = make_vfs();
            const folder = new Folder(ctx, "C:\\Users\\Construct");

            // TODO...

        });
    });
});
