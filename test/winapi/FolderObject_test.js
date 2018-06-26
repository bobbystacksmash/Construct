const assert            = require("chai").assert;
const Folder            = require("../../src/winapi/FolderObject");
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

    vfs.AddFolder(default_env.path);

    return Object.assign({}, context, opts);
}

describe("FolderObject", () => {

    describe("Object creation", () => {

        xit("should support being created from an existing VFS path", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFolder("C:\\RootOne\\SubFolder1");

            const folder = new Folder(ctx, "C:\\RootOne\\SubFolder1");

            // TODO...

        });
    });

    describe(".DateCreated", () => {

        it("should return a date object from when this folder was created", () => {

            const path =  "C:\\RootOne\\HelloWorld",
                  ctx  = make_ctx();

            ctx.vfs.AddFolder(path);

            const folder = new Folder(ctx, path);
            assert.instanceOf(folder.DateCreated, Date);
        });
    });

    describe(".DateLastAccessed", () => {

        it("should return a date object from when this folder was accessed", () => {

            const path =  "C:\\RootOne\\HelloWorld",
                  ctx  = make_ctx();

            ctx.vfs.AddFolder(path);

            const folder = new Folder(ctx, path);
            assert.instanceOf(folder.DateLastAccessed, Date);
        });
    });

    describe(".DateLastModified", () => {

        it("should return a date object from when this folder was last modified", () => {

            const path =  "C:\\RootOne\\HelloWorld",
                  ctx  = make_ctx();

            ctx.vfs.AddFolder(path);

            const folder = new Folder(ctx, path);
            assert.instanceOf(folder.DateLastModified, Date);
        });
    });

    describe(".Drive", () => {

        it("should return a Drive object when .Drive is looked-up", () => {

            const path = "C:\\RootOne\\HelloWorld",
                  ctx  = make_ctx();

            ctx.vfs.AddFolder(path);

            const folder = new Folder(ctx, path),
                  drive  = folder.Drive;

            assert.equal(drive.driveletter, "C");
            assert.equal(drive.isREADY, true);
            assert.isNumber(drive.totalsize);
        });
    });

    describe(".Files", () => {

        it("should return a read-only FilesCollection instance", () => {

            const path = "C:\\RootOne\\SubFolder1",
                  ctx  = make_ctx();

            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\foo.txt");
            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\bar.txt");
            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\baz.txt");

            const folder = new Folder(ctx, path),
                  files  = folder.Files;

            assert.equal(files.count, 3);
            assert.equal(files.Item("foo.txt").name, "foo.txt");
        });
    });

    describe(".IsRootFolder", () => {

        it("should return T|F whether or not the folder is the root volume", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1");

            assert.isFalse(new Folder(ctx, "C:\\RootOne\\SubFolder1").isRootFolder);
            assert.isFalse(new Folder(ctx, "C:\\RootOne").isrootfolder);
            assert.isFalse(new Folder(ctx, "C:").ISROOTFOLDER);
            assert.isTrue(new Folder(ctx, "C:\\").isrootfolder);
        });
    });

    describe(".Name", () => {

        it("should return the name of the current folder", () => {

            const ctx  = make_ctx(),
                  path = "C:\\RootOne\\SubFolder1";

            ctx.vfs.AddFolder(path);

            const folder = new Folder(ctx, path);

            assert.equal(folder.name, "SubFolder1");
        });
    });

    describe(".Name", () => {

        it("should return the basename of the backing path as the name", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFolder("C:\\RootOne\\HelloWorld");

            ["hellow~1", "HELLOW~1", "HelloWorld"].forEach(n => {
                const folder = new Folder(ctx, `C:\\RootOne\\${n}`);
                assert.equal(folder.name, n);
            });
        });

        it("should support throwing Path not found when folder.Delete() is called", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_path_not_found: () => {
                        throw new Error("folder was deleted");
                    }
                }
            });
            ctx.vfs.AddFolder("C:\\RootOne\\SubFolder1");

            const folder = new Folder(ctx, "C:\\RootOne\\SubFolder1");

            assert.doesNotThrow(() => folder.Delete());
            assert.throws(() => folder.name, "folder was deleted");
        });
    });

    describe(".ParentFolder", () => {

        it("should return a Folder object which represents the parent folder", () => {

            const ctx  = make_ctx(),
                  path = "C:\\RootOne\\SubFolder1";

            ctx.vfs.AddFolder(path);

            const folder = new Folder(ctx, path),
                  parent = folder.ParentFolder;

            assert.equal(parent.name, "RootOne");
        });

        it("should return undefined if the Folder is already root", () => {
            const ctx  = make_ctx();
            assert.equal(new Folder(ctx, "C:\\").ParentFolder, undefined);
        });

        it("should use env path if path is 'C:'", () => {
            const ctx = make_ctx();
            assert.equal(new Folder(ctx, "C:").Name, "Construct");
        });
    });

    describe(".Path", () => {

        it("should return the complete path to the current folder, including drive", () => {

            const path = "C:\\RootOne\\SubFolder1",
                  ctx  = make_ctx();

            ctx.vfs.AddFolder(path);

            const folder = new Folder(ctx, path);
            assert.equal(folder.path, path);
            assert.equal(new Folder(ctx, "C:\\").path, "C:\\");
        });

        it("should use the CWD when 'C:' is given", () => {
            const ctx = make_ctx();
            assert.equal(new Folder(ctx, "C:").path, ctx.get_env("path"));
        });
    });

    describe(".ShortName", () => {

        it("should return the shortname for the backing folder", () => {

            const path = "C:\\RootOneFoo\\SubFolder1",
                  ctx  = make_ctx();

            ctx.vfs.AddFolder(path);

            assert.equal(new Folder(ctx, path).ShortName, "SUBFOL~1");
            assert.equal(new Folder(ctx, "C:\\RootOneFoo").ShortName, "ROOTON~1");
            assert.equal(new Folder(ctx, "C:\\").shortname, "");
        });

        it("should return the folder name if the folder name is already a valid SFN", () => {

            const path = "C:\\RootOne\\foo",
                  ctx  = make_ctx();

            ctx.vfs.AddFolder(path);
            assert.equal(new Folder(ctx, path).ShortName, "foo");
        });
    });

    describe(".ShortPath", () => {

        it("should return a short path version of the path", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFolder("C:\\HelloWorld\\LongFolderName");
            ctx.vfs.AddFolder("C:\\Foo\\Bar\\Baz");

            assert.equal(new Folder(ctx, "C:\\HelloWorld\\LongFolderName").ShortPath,
                         "C:\\HELLOW~1\\LONGFO~1");

            assert.equal(new Folder(ctx, "C:\\Foo\\Bar\\Baz").ShortPath,
                         "C:\\Foo\\Bar\\Baz");

            assert.equal(new Folder(ctx, "C:\\").ShortPath, "C:\\");
        });
    });

    describe(".Size", () => {

        it("should return size as a number", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFolder("C:\\RootOne\\SubFolder1");

            const folder = new Folder(ctx, "C:\\RootOne");
            assert.isNumber(folder.size);
            assert.equal(folder.size, 0);

            ctx.vfs.AddFile("C:\\Foo\\bar.txt", "abcd");
            assert.equal(new Folder(ctx, "C:\\Foo").size, 4);
        });

        it("should throw when trying to retrieve the size of the root folder", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_permission_denied: () => {
                        throw new Error("root volume - cannot get size");
                    }
                }
            });

            ctx.vfs.AddFolder("C:\\RootOne\\SubFolder1");

            const folder = new Folder(ctx, "C:\\");
            assert.throws(() => folder.size, "root volume - cannot get size");
        });
    });

    describe(".SubFolders", () => {

        it("should return the subfolders for the given folder object", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFolder("C:\\RootOne\\SubFolder1");
            ctx.vfs.AddFolder("C:\\RootOne\\SubFolder2");
            ctx.vfs.AddFolder("C:\\RootOne\\SubFolder3");

            const folder     = new Folder(ctx, "C:\\RootOne"),
                  subfolders = folder.SubFolders;

            assert.equal(subfolders.count, 3);
            assert.equal(subfolders.Item("SubFolder1").ShortName, "SUBFOL~1");
        });

    });
});
