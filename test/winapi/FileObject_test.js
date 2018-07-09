const assert            = require("chai").assert;
const File            = require("../../src/winapi/FileObject.js");
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

describe("FileObject", () => {

    describe(".DateCreated", () => {

        it("should return a date object from when this file was created", () => {

            const path =  "C:\\RootOne\\HelloWorld.txt",
                  ctx  = make_ctx();

            ctx.vfs.AddFile(path);

            const file = new File(ctx, path);
            assert.instanceOf(file.DateCreated, Date);
        });
    });

    describe(".DateLastAccessed", () => {

        it("should return a date object from when this file was accessed", () => {

            const path =  "C:\\RootOne\\HelloWorld.txt",
                  ctx  = make_ctx();

            ctx.vfs.AddFile(path);

            const file = new File(ctx, path);
            assert.instanceOf(file.DateLastAccessed, Date);
        });
    });

    describe(".DateLastModified", () => {

        it("should return a date object from when this file was last modified", () => {

            const path =  "C:\\RootOne\\HelloWorld.txt",
                  ctx  = make_ctx();

            ctx.vfs.AddFile(path);

            const file = new File(ctx, path);
            assert.instanceOf(file.DateLastModified, Date);
        });
    });

    describe(".Drive", () => {

        it("should return a Drive object when .Drive is looked-up", () => {

            const path = "C:\\RootOne\\HelloWorld.txt",
                  ctx  = make_ctx();

            ctx.vfs.AddFile(path);

            const file = new File(ctx, path),
                  drive  = file.Drive;

            assert.equal(drive.driveletter, "C");
            assert.equal(drive.isREADY, true);
            assert.isNumber(drive.totalsize);
        });
    });

    describe(".Name", () => {

        it("should return the basename of the backing path as the name", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\RootOne\\HelloWorld.txt");

            ["hellow~1.txt", "HELLOW~1.TXT", "HelloWorld.txt"].forEach(n => {
                const file = new File(ctx, `C:\\RootOne\\${n}`);
                assert.equal(file.name, n);
            });
        });

        it("should rename the file when .Name is assigned to", () => {

            const path = "C:\\RootOne\\foo.txt",
                  ctx  = make_ctx();

            ctx.vfs.AddFile(path);

            const file = new File(ctx, path);

            assert.equal(file.name, "foo.txt");

            assert.isFalse(ctx.vfs.FileExists("C:\\RootOne\\bar.txt"));
            file.name = "bar.txt";
            assert.isTrue(ctx.vfs.FileExists("C:\\RootOne\\bar.txt"));
        });

        it("should throw 'file already exists' if the file already exists", () => {

            const path = "C:\\RootOne\\foo.txt",
                  ctx  = make_ctx({
                      exceptions: {
                          throw_file_already_exists: () => {
                              throw new Error("file exists");
                          }
                      }
                  });

            const file = new File(ctx, path);

            ctx.vfs.AddFile(path);

            assert.throws(() => file.Name = "foo.txt", "file exists");
        });

    });

    describe(".Parentfolder", () => {

    });

    describe(".Path", () => {

    });

    describe(".ShortName", () => {

    });

    describe(".ShortPath", () => {

    });

    describe(".Size", () => {

    });

    describe(".Type", () => {

    });

    describe("#Copy", () => {

    });

    describe("#Move", () => {

    });

    describe("#Delete", () => {

    });

    describe("#OpenAsTextStream", () => {

    });
});
