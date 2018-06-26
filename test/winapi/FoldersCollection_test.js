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
        });
    });


    describe("Item", () => {

        it("should fetch the item by name", () => {
            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\a.txt");

            const fc = new FoldersCollection(ctx, "C:\\RootOne");
            assert.equal(fc.Item("SubFolder1").name, "SubFolder1");
        });

        it("should fetch the item by SFN", () => {
            const ctx = make_ctx();
            ctx.vfs.AddFolder("C:\\RootOne\\LongFoldername");

            const fc = new FoldersCollection(ctx, "C:\\RootOne");
            assert.equal(fc.Item("LONGFO~1").name, "LONGFO~1");
        });

        it("should throw a 'path not found' exception if the folder doesn't exist", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_path_not_found: () => {
                        throw new Error("folder not found");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\a.txt");
            ctx.vfs.AddFile("C:\\RootOne\\SubFolder2\\b.txt");

            const fc = new FoldersCollection(ctx, "C:\\RootOne");
            assert.doesNotThrow(() => fc.Item("SubFolder1"));
            assert.throws(() => fc.Item("SubFolder3"), "folder not found");
        });

        it("should throw an 'invalid procedure call' exception if .Item arg is not string", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("not a string");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\a.txt");

            const fc = new FoldersCollection(ctx, "C:\\RootOne\\");

            assert.equal(fc.count, 1);

            assert.throws(() => fc.Item(2),          "not a string");
            assert.throws(() => fc.Item(null),       "not a string");
            assert.throws(() => fc.Item(undefined),  "not a string");
            assert.throws(() => fc.Item([]),         "not a string");
            assert.throws(() => fc.Item({}),         "not a string");
            assert.throws(() => fc.Item(() => true), "not a string");
        });

        it("should throw a 'path not found' exception if the backing folder is deleted", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_path_not_found: () => {
                        throw new Error("backing folder is gone");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\a.txt");
            ctx.vfs.AddFile("C:\\RootOne\\SubFolder2\\b.txt");

            const fc = new FoldersCollection(ctx, "C:\\RootOne");
            assert.equal(fc.count, 2);

            assert.doesNotThrow(() => fc.Item("SubFolder1"));

            ctx.vfs.Delete("C:\\RootOne\\SubFolder1");
            assert.throws(() => fc.Item("SubFolder1"), "backing folder is gone");
        });
    });
});
