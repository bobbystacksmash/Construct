const assert            = require("chai").assert;
const FoldersCollection = require("../../src/winapi/FoldersCollection");
const VirtualFileSystem = require("../../src/runtime/virtfs");

function make_ctx (opts) {

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

    let vfs = new VirtualFileSystem(context);
    context.vfs = vfs;
    return Object.assign({}, context, opts);
}

describe("FoldersCollection", () => {

    describe("Count", () => {

        it("should return the correct count for folders in the collection", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFolder("C:\\RootOne\\a");
            ctx.vfs.AddFolder("C:\\RootOne\\b");
            ctx.vfs.AddFolder("C:\\RootOne\\c");

            const fc = new FoldersCollection(ctx, "C:\\RootOne");

            assert.equal(fc.count, 3);
        });

        it("should return zero if there are no folders in the collection", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFolder("C:\\RootOne");

            const fc = new FoldersCollection(ctx, "C:\\RootOne");

            assert.equal(fc.count, 0);
        });

        it("should update count if new folders are added after instantiation", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFolder("C:\\RootOne");
            ctx.vfs.AddFolder("C:\\RootOne\\a");
            ctx.vfs.AddFolder("C:\\RootOne\\b");
            ctx.vfs.AddFolder("C:\\RootOne\\c");

            const fc = new FoldersCollection(ctx, "C:\\RootOne");
            assert.equal(fc.count, 3);

            // Add a new folder
            ctx.vfs.AddFolder("C:\\RootOne\\d");
            assert.equal(fc.count, 4);

            // TODO: CHECK THIS WORKS THE SAME IN WINDOWS!

        });
    });

});
