const assert            = require("chai").assert;
const File              = require("../../src/winapi/FileObject.js");
const VirtualFileSystem = require("../../src/runtime/virtfs");
const win32path         = require("path").win32;

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

    var default_assoc = {
        "txt": "Text Document",
        "jpg": "JPEG image"
    };

    let env   = Object.assign({}, default_env, opts.environment),
        cfg   = Object.assign({}, default_cfg, opts.config),
        assoc = Object.assign({}, default_assoc, opts.associations),
        epoch = opts.epoch || 1234567890;

    function get_file_assoc (f) {

        const extname = win32path
                  .extname(win32path.basename(f))
                  .toLowerCase()
                  .replace(".", "");

        if (assoc.hasOwnProperty(extname)) {
            return assoc[extname];
        }

        return `${extname} File`;
    }

    let context = {
        epoch: epoch,
        ENVIRONMENT: env,
        CONFIG: cfg,
        emitter: { emit: () => {} },
        get_env: (e) => env[e],
        get_cfg: (c) => cfg[c],
        get_file_association: (f) => get_file_assoc(f)
    };

    let vfs = new VirtualFileSystem(context);
    context.vfs = vfs;
    return Object.assign({}, context, opts);
}

describe("FileObject", () => {

    describe("Construction", () => {

        it("should throw if the given file is a folder", () => {

            const path = "C:\\RootOne",
                  ctx  = make_ctx({
                      exceptions: {
                          throw_file_not_found: () => {
                              throw new Error("no file");
                          }
                      }
                  });

            ctx.vfs.AddFolder(path);
            assert.throws(() => new File(ctx, path), "no file");
        });

        it("should throw if the supplied file does not exist", () => {

            const path = "C:\\RootOne",
                  ctx  = make_ctx({
                      exceptions: {
                          throw_file_not_found: () => {
                              throw new Error("no file");
                          }
                      }
                  });

            ctx.vfs.AddFolder(path);
            assert.throws(() => new File(ctx, `${path}\\does_not_exist.txt`), "no file");
        });

        it("should throw if the folderpath does not exist", () => {
            const ctx  = make_ctx({
                exceptions: {
                    throw_file_not_found: () => {
                        throw new Error("no file");
                    }
                }
            });

            assert.throws(() => new File(ctx, "C:\\Does\\Not\\Exist.txt"), "no file");
        });
    });

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

        // TODO: Add a test which asserts that a throw occurs when
        // trying to write to a file whose name contains illegal
        // chars.

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

            ctx.vfs.AddFile(path);
            const file = new File(ctx, path);
            assert.throws(() => file.Name = "foo.txt", "file exists");
        });

    });

    describe(".Parentfolder", () => {

        it("should return a Folder object which represents the parent folder", () => {

            const ctx  = make_ctx(),
                  path = "C:\\RootOne\\SubFolder1\\foo.txt";

            ctx.vfs.AddFile(path);

            const file = new File(ctx, path),
                  parent = file.ParentFolder;

            assert.equal(parent.name, "SubFolder1");
        });

        it("should return undefined if the Folder is already root", () => {
            const ctx  = make_ctx();
            ctx.vfs.AddFile("C:\\foo.txt");
            const file = new File(ctx, "C:\\foo.txt");
            assert.equal(file.ParentFolder, undefined);
        });

        it("should use env path if path is 'C:'", () => {
            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\Users\\Construct\\foo.txt");

            assert.equal(new File(ctx, "c:foo.txt").ParentFolder.name, "Construct");
            assert.equal(new File(ctx,   "foo.txt").ParentFolder.name, "Construct");
        });
    });

    describe(".Path", () => {

        it("should return the complete path to the current folder, including drive", () => {

            const path = "C:\\RootOne\\SubFolder1\\foo.txt",
                  ctx  = make_ctx();

            ctx.vfs.AddFile(path);

            const file = new File(ctx, path);
            assert.equal(file.path, path);
        });
    });

    describe(".ShortName", () => {

        it("should return the shortname for the backing file", () => {

            const path = "C:\\RootOneFoo\\SubFolder1\\helloworld.txt",
                  ctx  = make_ctx();

            ctx.vfs.AddFile(path);

            assert.equal(new File(ctx, path).ShortName, "HELLOW~1.TXT");
        });

        it("should return the file name if the file name is already a valid SFN", () => {

            const path = "C:\\RootOne\\foo.txt",
                  ctx  = make_ctx();

            ctx.vfs.AddFile(path);
            assert.equal(new File(ctx, path).ShortName, "foo.txt");
        });
    });

    describe(".ShortPath", () => {

        it("should return a short path version of the path", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFile("C:\\HelloWorld\\LongFileName.txt");
            ctx.vfs.AddFile("C:\\Foo\\Bar\\Baz.txt");
            ctx.vfs.AddFile("C:\\hi.txt");

            assert.equal(new File(ctx, "C:\\HelloWorld\\LongFileName.txt").ShortPath,
                         "C:\\HELLOW~1\\LONGFI~1.TXT");

            assert.equal(new File(ctx, "C:\\Foo\\Bar\\Baz.txt").ShortPath,
                         "C:\\Foo\\Bar\\Baz.txt");

            assert.equal(new File(ctx, "C:\\hi.txt").ShortPath, "C:\\hi.txt");
        });
    });

    describe(".Size", () => {

        it("should return size as a number", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\foo.txt");

            ctx.vfs.AddFile("C:\\Foo\\bar.txt", "abcd");
            assert.equal(new File(ctx, "C:\\Foo\\bar.txt").size, 4);

            const file = new File(ctx, "C:\\RootOne\\SubFolder1\\foo.txt");
            assert.isNumber(file.size);
            assert.equal(file.size, 0);

        });
    });

    describe(".Type", () => {

        it("should return the correct type for all known type instances", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\foo.txt");
            ctx.vfs.AddFile("C:\\bar.jpg");
            ctx.vfs.AddFile("C:\\baz.boo");

            assert.equal(new File(ctx, "C:\\foo.txt").type, "Text Document");
            assert.equal(new File(ctx, "C:\\bar.jpg").type, "JPEG image");
            assert.equal(new File(ctx, "C:\\baz.boo").type, "boo File");
        });
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
