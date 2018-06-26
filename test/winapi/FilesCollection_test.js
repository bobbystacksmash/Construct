const assert            = require("chai").assert;
const FilesCollection   = require("../../src/winapi/FilesCollection");
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

describe("FilesCollection", () => {

    describe("Count", () => {

        it("should return the correct count for files in the collection", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFile("C:\\RootOne\\a.txt");
            ctx.vfs.AddFile("C:\\RootOne\\b.txt");
            ctx.vfs.AddFile("C:\\RootOne\\c.txt");

            const fc = new FilesCollection(ctx, "C:\\RootOne");
            assert.isNumber(fc.count);
            assert.equal(fc.count, 3);
        });

        it("should return zero if there are no files in the collection", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFolder("C:\\RootOne");

            const fc = new FilesCollection(ctx, "C:\\RootOne");
            assert.equal(fc.count, 0);
        });

        it("should update count if new files are added after instantiation", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFolder("C:\\RootOne");
            ctx.vfs.AddFile("C:\\RootOne\\a.txt");
            ctx.vfs.AddFile("C:\\RootOne\\b.txt");
            ctx.vfs.AddFile("C:\\RootOne\\c.txt");

            const fc = new FilesCollection(ctx, "C:\\RootOne");
            assert.equal(fc.count, 3);

            ctx.vfs.AddFile("C:\\RootOne\\d.txt");
            assert.equal(fc.count, 4);
        });

        it("should update count if files are deleted after instantiation", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFolder("C:\\RootOne");
            ctx.vfs.AddFile("C:\\RootOne\\a.txt");
            ctx.vfs.AddFile("C:\\RootOne\\b.txt");
            ctx.vfs.AddFile("C:\\RootOne\\c.txt");

            const fc = new FilesCollection(ctx, "C:\\RootOne");
            assert.equal(fc.count, 3);

            ctx.vfs.Delete("C:\\RootOne\\c.txt");
            assert.equal(fc.count, 2);
        });

        it("should not update the count if a new FOLDER is added to the dir", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFolder("C:\\RootOne");
            ctx.vfs.AddFile("C:\\RootOne\\a.txt");
            ctx.vfs.AddFile("C:\\RootOne\\b.txt");
            ctx.vfs.AddFile("C:\\RootOne\\c.txt");

            const fc = new FilesCollection(ctx, "C:\\RootOne");
            assert.equal(fc.count, 3);

            ctx.vfs.AddFolder("C:\\RootOne\\foo");
            assert.equal(fc.count, 3);
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
            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\b.txt");

            const fc = new FilesCollection(ctx, "C:\\RootOne\\SubFolder1");
            assert.equal(fc.count, 2);

            ctx.vfs.Delete("C:\\RootOne\\SubFolder1");
            assert.throws(() => fc.count, "backing folder is gone");
        });
    });

    xdescribe("Item", () => {

        it("should fetch the item by name", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\RootOne\\a.txt");
            const fc = new FilesCollection(ctx, "C:\\RootOne");

            assert.equal(fc.Item("a.txt").name, "a.txt");
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
            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\b.txt");

            const fc = new FilesCollection(ctx, "C:\\RootOne\\SubFolder1");
            assert.equal(fc.count, 2);

            ctx.vfs.Delete("C:\\RootOne\\SubFolder1");
            assert.throws(() => fc.Item("a.txt"), "backing folder is gone");
        });
    });
});
