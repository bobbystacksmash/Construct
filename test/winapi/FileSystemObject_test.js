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

describe("Scripting.FileSystemObject", () => {

    describe("#BuildPath", () => {

        it("should build a path from two parts", () => {

            let fso = make_FSO();

            assert.equal(fso.BuildPath("foo", "bar"), "foo\\bar");
            assert.equal(fso.BuildPath("\\\\foo\\bar", "testing\\test.txt"),
                         "\\\\foo\\bar\\testing\\test.txt");

        });

        it("should just combine the two parts, not check if they're valid", () => {

            let fso = make_FSO();

            assert.equal(fso.BuildPath("C:\\foo\\bar", "../../../baz"),
                         "C:\\foo\\bar\\../../../baz");

        });
    });

    describe("#CopyFile", () => {

        it("should throw file not found if src file does not exist", () => {

            fso = make_FSO({
                exceptions: {
                    throw_file_not_found: () => {
                        throw new Error("cannot find src file");
                    }
                }
            });

            assert.throws(() =>
                          fso.CopyFile("missing.txt", "foo.txt"),
                          "cannot find src file"
                         );


        });

        it("should throw path not found if the dest dir does not exist", () => {

            fso = make_FSO({
                exceptions: {
                    throw_path_not_found: () => {
                        throw new Error("cannot find dest dir");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\file.txt");
            assert.throws(() =>
                          fso.CopyFile("C:\\file.txt", "C:\\No\\Dir\\here.txt"),
                          "cannot find dest dir");
        });

        it("should throw if a file copy operation matches destination folder (ambiguous)", () => {

            let fso = make_FSO({
                exceptions: {
                    throw_permission_denied: () => {
                        throw new Error("file copy is ambiguous");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\Users\\Construct\\file_a.txt");
            ctx.vfs.AddFolder("C:\\Users\\Construct\\bar");

            assert.throws(() => fso.CopyFile(
                "C:\\Users\\Construct\\file_a.txt", "C:\\Users\\Construct\\bar"
            ), "file copy is ambiguous");
        });

        it("should copy in to a directory when a path ends with a trailing slash", () => {

            let fso = make_FSO();

            ctx.vfs.AddFile("C:\\Users\\Construct\\file_a.txt");
            ctx.vfs.AddFolder("C:\\Users\\Construct\\bar");

            assert.isFalse(ctx.vfs.FileExists("C:\\Users\\Construct\\bar\\file_a.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\Users\\Construct\\file_a.txt"));

            assert.doesNotThrow(() =>
                                fso.CopyFile("C:\\Users\\Construct\\file_a.txt",
                                             "C:\\Users\\Construct\\bar\\"));

            assert.isTrue(ctx.vfs.FileExists("C:\\Users\\Construct\\bar\\file_a.txt"));
        });

        it("should support copying wildcards", () => {

            const fso = make_FSO();

            ctx.vfs.AddFolder("C:\\Users\\Construct\\source");
            ctx.vfs.AddFile("C:\\Users\\Construct\\source\\foo.txt");
            ctx.vfs.AddFile("C:\\Users\\Construct\\source\\bar.txt");
            ctx.vfs.AddFile("C:\\Users\\Construct\\source\\baz.txt");
            ctx.vfs.AddFile("C:\\Users\\Construct\\source\\fox.txt");
            ctx.vfs.AddFile("C:\\Users\\Construct\\source\\fff.txt");

            ctx.vfs.AddFolder("C:\\Users\\Construct\\dest");

            assert.deepEqual(ctx.vfs.FindFiles("C:\\Users\\Construct\\dest", "*"), []);

            fso.CopyFile("C:\\Users\\Construct\\source\\f??.txt", "C:\\Users\\Construct\\dest");

            assert.deepEqual(ctx.vfs.FindFiles("C:\\Users\\Construct\\dest", "*.txt").sort(),
                             ["foo.txt", "fox.txt", "fff.txt"].sort());
        });

        it("should copy a file and all SFN/LFN paths to it should be correct", () => {

            const fso = make_FSO();

            ctx.vfs.AddFile("C:\\HelloWorld\\SubFolderA\\LongFilename.txt", "source file");
            ctx.vfs.AddFolder("C:\\dest");

            assert.isFalse(ctx.vfs.FileExists("C:\\dest\\LongFilename.txt"));
            assert.isFalse(ctx.vfs.FileExists("C:\\dest\\LONGFI~1.TXT"));

            fso.CopyFile("C:\\HELLOW~1\\SubFolderA\\LONGFI~1.TXT", "C:\\dest\\LongFilename.txt");

            assert.isTrue(ctx.vfs.FileExists("C:\\dest\\LONGFI~1.TXT"));

            // WHY DOES This FAIL?
            assert.isTrue(ctx.vfs.FileExists("C:\\dest\\LongFilename.txt"));
        });
    });

    describe("#CopyFolder", () => {

        it("should copy a folder from one place to another with all files", () => {

            const fso = make_FSO({});

            ctx.vfs.AddFolder("C:\\source\\dir1");
            ctx.vfs.AddFile("C:\\source\\dir1\\foo.txt");

            ctx.vfs.AddFolder("C:\\dest");

            assert.isFalse(ctx.vfs.FolderExists("C:\\dest\\dir1"));
            assert.isFalse(ctx.vfs.FileExists("C:\\dest\\dir1\\foo.txt"));

            fso.CopyFolder("C:\\source\\dir1", "C:\\dest");

            assert.isTrue(ctx.vfs.FolderExists("C:\\dest\\dir1"));
            assert.isTrue(ctx.vfs.FileExists("C:\\dest\\dir1\\foo.txt"));
        });

        it("should copy all folders matching a wildcard expression", () => {

            const fso = make_FSO();

            ctx.vfs.AddFolder("C:\\source\\dir1");
            ctx.vfs.AddFolder("C:\\source\\dir2");
            ctx.vfs.AddFolder("C:\\source\\dir3");
            ctx.vfs.AddFolder("C:\\source\\foo");

            ctx.vfs.AddFolder("C:\\source\\bar");

            ctx.vfs.AddFolder("C:\\dest");

            ctx.vfs.AddFile("C:\\source\\dir1\\foo.txt");
            ctx.vfs.AddFile("C:\\source\\dir2\\bar.txt");
            ctx.vfs.AddFile("C:\\source\\dir3\\baz.txt");

            assert.isFalse(ctx.vfs.FolderExists("C:\\dest\\dir1"));
            assert.isFalse(ctx.vfs.FolderExists("C:\\dest\\dir1"));
            assert.isFalse(ctx.vfs.FolderExists("C:\\dest\\dir1"));

            fso.CopyFolder("C:\\source\\dir?", "C:\\dest");

            assert.isTrue(ctx.vfs.FolderExists("C:\\dest\\dir1"));
            assert.isTrue(ctx.vfs.FolderExists("C:\\dest\\dir2"));
            assert.isTrue(ctx.vfs.FolderExists("C:\\dest\\dir3"));

            assert.isTrue(ctx.vfs.FileExists("C:\\dest\\dir1\\foo.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\dest\\dir2\\bar.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\dest\\dir3\\baz.txt"));

        });

        it("should correctly copy with no trailing separator on the destination path", () => {

            // From Chapter 10, P.280 "VBScript in a Nutshell" book.
            const fso = make_FSO();

            ctx.vfs.AddFolder("C:\\RootOne\\SubFolder1");
            ctx.vfs.AddFolder("C:\\RootOne\\SubFolder2");
            ctx.vfs.AddFolder("C:\\RootTwo");

            fso.CopyFolder("C:\\RootOne\\*", "C:\\RootTwo");

            assert.isTrue(ctx.vfs.FolderExists("C:\\RootTwo\\SubFolder1"));
            assert.isTrue(ctx.vfs.FolderExists("C:\\RootTwo\\SubFolder2"));
        });

        it("should correctly copy with a trailing separator in to the destination", () => {

            // From Chapter 10, P.280 "VBScript in a Nutshell" book.

            const fso = make_FSO();

            ctx.vfs.AddFolder("C:\\RootOne\\SubFolder1");
            ctx.vfs.AddFolder("C:\\RootOne\\SubFolder2");
            ctx.vfs.AddFolder("C:\\RootTwo");

            assert.isFalse(ctx.vfs.FolderExists("C:\\RootTwo\\RootOne"));
            assert.isFalse(ctx.vfs.FolderExists("C:\\RootTwo\\RootOne\\SubFolder1"));
            assert.isFalse(ctx.vfs.FolderExists("C:\\RootTwo\\RootOne\\SubFolder2"));

            assert.isFalse(ctx.vfs.FolderExists("C:\\RootTwo\\RootOne"));
            assert.isFalse(ctx.vfs.FolderExists("C:\\RootTwo\\RootOne\\SubFolder1"));
            assert.isFalse(ctx.vfs.FolderExists("C:\\RootTwo\\RootOne\\SubFolder2"));

            fso.CopyFolder("C:\\RootOne", "C:\\RootTwo\\");

            assert.isTrue(ctx.vfs.FolderExists("C:\\RootTwo\\RootOne"));
            assert.isTrue(ctx.vfs.FolderExists("C:\\RootTwo\\RootOne\\SubFolder1"));
            assert.isTrue(ctx.vfs.FolderExists("C:\\RootTwo\\RootOne\\SubFolder2"));
        });

        it("should throw if a wildcard character is used anywhere in the destination", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("no wildcards in dest path");
                    }
                }
            });

            ctx.vfs.AddFolder("C:\\RootOne\\SubFolder1");
            ctx.vfs.AddFolder("C:\\RootTwo");

            assert.throws(() => fso.CopyFolder("C:\\RootOne", "C:\\RootTwo*"),
                          "no wildcards in dest path");

            assert.throws(() => fso.CopyFolder("C:\\RootOne", "C:\\*\\RootTwo"),
                          "no wildcards in dest path");
        });

        it("should throw if source contains a wildcard which isn't the last part", () =>{

            const fso = make_FSO({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("no wildcards in src dirname");
                    }
                }
            });

            ctx.vfs.AddFolder("C:\\RootOne\\SubFolder1");
            ctx.vfs.AddFolder("C:\\RootTwo");

            assert.throws(()=> fso.CopyFolder("C:\\*\\SubFolder1", "C:\\RootTwo"),
                          "no wildcards in src dirname");
        });

        it("should successfully copy to the root of the volume.", () => {

            const fso = make_FSO();

            ctx.vfs.AddFolder("C:\\RootOne\\SubFolder1");

            assert.isFalse(ctx.vfs.FolderExists("C:\\SubFolder1"));
            fso.CopyFolder("C:\\RootOne\\SubFolder1", "C:\\");
            assert.isTrue(ctx.vfs.FolderExists("C:\\SubFolder1"));
        });

        it("should not throw when source and destination are the same", () => {

            const vfs = make_FSO();

            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\foo.txt");

            assert.doesNotThrow(() => vfs.CopyFolder("C:\\RootOne\\SubFolder1",
                                                     "C:\\RootOne\\SubFolder1"));
        });

        it("should recursively copy until source and dest paths are equal, then throw", () => {

            const vfs = make_FSO({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("copy in to self not allowed");
                    }
                }
            });

            ctx.vfs.AddFolder("C:\\RootOne\\a");
            ctx.vfs.AddFolder("C:\\RootOne\\b");
            ctx.vfs.AddFolder("C:\\RootOne\\c");
            ctx.vfs.AddFolder("C:\\RootOne\\d");
            ctx.vfs.AddFolder("C:\\RootOne\\z");
            ctx.vfs.AddFile("C:\\RootOne\\a.txt");
            ctx.vfs.AddFile("C:\\RootOne\\b.txt");
            ctx.vfs.AddFile("C:\\RootOne\\a\\hi.txt");

            assert.throws(() =>
                          vfs.CopyFolder("C:\\RootOne\\*", "C:\\RootOne\\z"),
                          "copy in to self not allowed");

            assert.isTrue(ctx.vfs.FolderExists("C:\\RootOne\\z\\a"));
            assert.isTrue(ctx.vfs.FolderExists("C:\\RootOne\\z\\b"));
            assert.isTrue(ctx.vfs.FolderExists("C:\\RootOne\\z\\c"));
            assert.isTrue(ctx.vfs.FolderExists("C:\\RootOne\\z\\d"));
            assert.isTrue(ctx.vfs.FileExists("C:\\RootOne\\z\\a\\hi.txt"));

            // Doesn't copy these files, as the copy from rootone\z to
            // rootone\z throws.  This also ensures search order is
            // lexically ordered.
            assert.isFalse(ctx.vfs.FileExists("C:\\RootOne\\z\\a.txt"));
            assert.isFalse(ctx.vfs.FileExists("C:\\RootOne\\z\\b.txt"));
        });

        it("should throw if overwrite is false and a file already exists", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_file_already_exists: () => {
                        throw new Error("file exists");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\a.txt");
            ctx.vfs.AddFile("C:\\RootOne\\SubFolder2\\b.txt");
            ctx.vfs.AddFile("C:\\RootOne\\SubFolder3\\c.txt");

            ctx.vfs.AddFile("C:\\RootTwo\\SubFolder2\\b.txt");

            assert.isFalse(ctx.vfs.FileExists("C:\\RootTwo\\SubFolder1\\a.txt"));
            assert.isFalse(ctx.vfs.FileExists("C:\\RootTwo\\SubFolder1\\c.txt"));

            assert.isTrue(ctx.vfs.FileExists("C:\\RootTwo\\SubFolder2\\b.txt"));

            assert.throws(() => fso.CopyFolder("C:\\RootOne\\*", "C:\\RootTwo", false),
                          "file exists");

            // It should have copied some files before the throw
            assert.isTrue(ctx.vfs.FileExists("C:\\RootTwo\\SubFolder1\\a.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\RootTwo\\SubFolder2\\b.txt"));

            // But no files after...
            assert.isFalse(ctx.vfs.FileExists("C:\\RootTwo\\SubFolder3\\c.txt"));
        });

        it("should copy and all SFNs should resolve correctly", () => {

            const fso = make_FSO();

            ctx.vfs.AddFile("C:\\HelloWorld\\SubFolderA\\LongFilename.txt", "source file");
            ctx.vfs.AddFolder("C:\\dest");

            fso.CopyFolder("C:\\HelloWorld", "C:\\dest");

            assert.isTrue(ctx.vfs.FileExists("C:\\dest\\HELLOW~1\\SUBFOL~1\\LongFilename.txt"));

            assert.isTrue(ctx.vfs.FolderExists("C:\\dest\\HELLOW~1\\SUBFOL~1"));
            assert.isTrue(ctx.vfs.FileExists("C:\\dest\\HELLOW~1\\SUBFOL~1\\LongFilename.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\dest\\HELLOW~1\\SUBFOL~1\\LONGFI~1.TXT"));

            // Let's change the contents of the file and make sure the
            // link points to the copy not the original.
            ctx.vfs.AddFile("C:\\dest\\HELLOW~1\\SUBFOL~1\\LONGFI~1.TXT", "testing...");
        });

        it("should copy to paths which contain '/../'", () => {

            const fso = make_FSO();

            ctx.vfs.AddFile("C:\\HelloWorld\\SubFolderA\\LongFilename.txt", "source file");
            ctx.vfs.AddFolder("C:\\dest");

            fso.CopyFolder("C:\\HelloWorld\\SubFolderA\\..", "C:\\dest");

            assert.isTrue(ctx.vfs.FolderExists("C:\\dest\\HelloWorld\\SubFolderA"));
            assert.isTrue(ctx.vfs.FileExists("C:\\dest\\HelloWorld\\SubFolderA\\longfilename.txt"));
        });
    });

    describe("#CreateFolder", () => {

        it("should successfully create and return a Folder instance", () => {

            let fso = make_FSO();
            assert.isFalse(ctx.vfs.FolderExists("C:\\foo\\bar"));

            let dir = fso.CreateFolder("C:\\foo\\bar");

            assert.equal(dir.name, "bar");
            assert.equal(dir.path, "C:\\foo\\bar");
        });

        it("should throw if the folder already exists", () => {

            let fso = make_FSO({
                exceptions: {
                    throw_file_already_exists: () => {
                        throw new Error("folder exists");
                    }
                }
            });

            ctx.vfs.AddFolder("C:\\RootOne");
            assert.isTrue(ctx.vfs.FolderExists("C:\\RootOne"));
            assert.throws(() => fso.CreateFolder("C:\\RootOne"), "folder exists");
        });

        it("should create a folder in the CWD if only a foldername is given", () => {

            const fso = make_FSO();

            // CWD is ctx.get_env("path") == "C:\Users\Construct".
            assert.isFalse(ctx.vfs.FolderExists("C:\\Users\\Construct\\RootOne"));

            fso.CreateFolder("RootOne");
            assert.isTrue(ctx.vfs.FolderExists("C:\\Users\\Construct\\RootOne"));
        });

        it("should correctly handle relative paths", () => {

            const fso = make_FSO();

            // CWD is ctx.get_env("path") == "C:\Users\Construct".
            assert.isFalse(ctx.vfs.FolderExists("C:\\Users\\RootOne"));

            fso.CreateFolder("..\\RootOne");
            assert.isTrue(ctx.vfs.FolderExists("C:\\Users\\RootOne"));
        });

        it("should throw 'type mismatch' for a null argument", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_type_mismatch: () => {
                        throw new Error("null is type mismatch");
                    }
                }
            });

            assert.throws(() => fso.CreateFolder(null), "null is type mismatch");
        });

        it("should throw 'invalid procedure call or argument' for non-string arguments", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("bad foldername");
                    }
                }
            });

            let bad_file_names = [
                "",
                undefined
            ];

            bad_file_names.forEach(
                (f) => assert.throws(() => fso.CreateFolder(f), "bad foldername")
            );
        });

        it("should create a folder named '1' if the Number 1 is given as a folder name", () => {

            const fso = make_FSO();

            assert.isFalse(ctx.vfs.FolderExists("C:\\Users\\Construct\\1"));

            fso.CreateFolder(1);
            assert.isTrue(ctx.vfs.FolderExists("C:\\Users\\Construct\\1"));
        });

        it("should create a folder named '[Object object]' for folder name param '{}'", () => {

            const fso = make_FSO();
            assert.isFalse(ctx.vfs.FolderExists("C:\\Users\\Construct\\[Object object]"));
            fso.CreateFolder({});
            assert.isTrue(ctx.vfs.FolderExists("C:\\Users\\Construct\\[object Object]"));
        });

        it("should throw 'bad filename or number' if the path param is invalid", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_bad_filename_or_number: () => {
                        throw new Error("bad filename");
                    }
                }
            });

            let bad_path_names = [
                "c/a:b",
                null,
                [],
                "foo*"
            ];

            bad_path_names.forEach(p => assert.throws(() => fso.CreateFolder(p)));
        });
    });


    describe("#CreateTextFile", () => {

        it("should throw 'bad filename or number' if a wildcard appears in the filename", () => {

            let fso = make_FSO({
                exceptions: {
                    throw_bad_filename_or_number: () => {
                        throw new Error("wildcards not permitted");
                    }
                }});

            assert.throws(() => fso.CreateTextFile("foo*.txt"),       "wildcards not permitted");
            assert.throws(() => fso.CreateTextFile("C:\\foo>.txt"),   "wildcards not permitted");
            assert.throws(() => fso.CreateTextFile("C:\\*\\foo.txt"), "wildcards not permitted");
        });

        it("should throw if overwriting is is disabled", () => {

            let fso = make_FSO({
                exceptions: {
                    throw_file_already_exists: () => {
                        throw new Error("file exists...");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\file.txt", "abcd");
            const OVERWRITE = false;
            assert.throws(() => fso.CreateTextFile("C:\\file.txt", OVERWRITE), "file exists...");
            assert.equal(ctx.vfs.ReadFileContents("C:\\file.txt"), "abcd");
        });

        it("should create the text file in the CWD if no path is given", () => {

            let fso = make_FSO();

            assert.isFalse(ctx.vfs.FileExists("C:\\Users\\Construct\\file.txt"));
            fso.CreateTextFile("file.txt");
            assert.isTrue(ctx.vfs.FileExists("C:\\Users\\Construct\\file.txt"));
        });

        it("should create a file even if the path is relative", () => {

            let fso = new FSO(ctx);

            ctx.vfs.AddFolder("C:\\RootDir\\subdir1");
            assert.isFalse(ctx.vfs.FileExists("C:\\RootDir\\subdir1\\helloworld.txt"));

            fso.CreateTextFile("..\\..\\RootDir\\subdir1\\helloworld.txt");
            assert.isTrue(ctx.vfs.FileExists("C:\\RootDir\\subdir1\\helloworld.txt"));
        });

        it("should throw path not found if the path does not exist", () => {

            let fso = make_FSO({
                exceptions: {
                    throw_path_not_found: () => {
                        throw new Error("path not found (av:false)");
                    }
                },
                config: { autovivify: false } });

            assert.throws(
                () => fso.CreateTextFile("C:\\bogus\\path.txt"), "path not found (av:false)"
            );
        });

        it("should return a TextStream instance", () => {

            let fso = make_FSO(),
                ts  = fso.CreateTextFile("file.txt");

            let ts_api = [
                "Read", "ReadAll", "ReadLine", "Skip", "SkipLine",
                "Write", "WriteBlankLines", "WriteLine"
            ];

            ts_api.forEach((method) => assert.isFunction(ts[method]));
        });

        it("should open a text file and then fail to write to it by default", () => {

            ctx.vfs.AddFile("C:\\file.txt", "Hello, World!");

            let fso = make_FSO();

            var ts;
            assert.doesNotThrow(() => ts = fso.CreateTextFile("C:\\file.txt"));
            assert.doesNotThrow(() => ts.write("overwrite successful"));

            assert.equal(ctx.vfs.ReadFileContents("C:\\file.txt"), "overwrite successful");
        });

        it("should write unicode if signalled to do so", () => {

            let fso = make_FSO(),
                ts  = fso.CreateTextFile("C:\\unicode.txt", true, true);

            ts.Write("7-bit ASCII or GTFO...");

            let filebuf = ctx.vfs.ReadFileContents("C:\\unicode.txt");

            assert.deepEqual(
                filebuf.slice(0, 8),
                Buffer.from([
                    0xFF, // BOM
                    0xFE, // BOM
                    0x37, // '7'
                    0x00, //
                    0x2d, // '-'
                    0x00, //
                    0x62, // 'b'
                    0x00, //
                ])
            );
        });
    });

    describe("#DeleteFile", () => {

        it("should delete the file given in the supplied filespec", () => {

            const fso = make_FSO();

            ctx.vfs.AddFile("C:\\RootOne\\SubDir1\\foo.txt");
            assert.isTrue(ctx.vfs.FileExists("C:\\RootOne\\SubDir1\\foo.txt"));

            fso.DeleteFile("C:\\RootOne\\SubDir1\\foo.txt");
            assert.isFalse(ctx.vfs.FileExists("C:\\RootOne\\SubDir1\\foo.txt"));
        });

        it("should delete all files matching the wildcard expression", () => {

            const fso = make_FSO();

            ctx.vfs.AddFile("C:\\RootOne\\foo_1.txt");
            ctx.vfs.AddFile("C:\\RootOne\\foo_2.txt");
            ctx.vfs.AddFile("C:\\RootOne\\bar.txt");

            fso.DeleteFile("C:\\RootOne\\foo*.txt");

            assert.isFalse(ctx.vfs.FileExists("C:\\RootOne\\foo_1.txt"));
            assert.isFalse(ctx.vfs.FileExists("C:\\RootOne\\foo_2.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\RootOne\\bar.txt"));
        });

        it("should not throw 'file not found' if no files match", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_file_not_found: () => {
                        throw new Error("no files match");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\RootOne\\foo_1.txt");
            ctx.vfs.AddFile("C:\\RootOne\\foo_2.txt");
            ctx.vfs.AddFile("C:\\RootOne\\bar.txt");

            assert.throws(() => fso.DeleteFile("C:\\RootOne\\nomatch*.txt"), "no files match");
        });

        it("should throw 'bad filename or number' if non-filepart contains a wildcard", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_bad_filename_or_number: () => {
                        throw new Error("no wildcards");
                    }
                }
            });

            assert.throws(() => fso.DeleteFile("C:\\Users\\Construct\\*\\Desktop\\blah.txt"),
                          "no wildcards");
        });

        it("should delete the file if the filename is literal", () => {

            const fso = make_FSO();

            ctx.vfs.AddFile("C:\\RootOne\\foo.txt");
            assert.doesNotThrow(() => fso.DeleteFile("C:\\RootOne\\foo.txt"));
            assert.isFalse(ctx.vfs.FileExists("C:\\RootOne\\foo.txt"));
        });

        it("should delete files in the CWD if the path is relative", () => {

            const fso  = make_FSO(),
                  file = ctx.get_env("path") + "\\foo.txt";

            ctx.vfs.AddFile(file);
            assert.isTrue(ctx.vfs.FileExists(file));

            fso.DeleteFile(file);
            assert.isFalse(ctx.vfs.FileExists(file));
        });

        it("should do the right thing when deleting from the root", () => {

            const fso = make_FSO({
                ENVIRONMENT: { path: "C:\\" }
            });

            ctx.vfs.AddFile("C:\\foo.txt");
            assert.isTrue(ctx.vfs.FileExists("C:\\foo.txt"));

            fso.DeleteFile("C:\\foo.txt");
            assert.isFalse(ctx.vfs.FileExists("C:\\foo.txt"));
        });

        it("should throw 'bad filename or number' if the path is invalid", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_bad_filename_or_number: () => {
                        throw new Error("invalid filename");
                    }
                }
            });

            assert.throws(() => fso.DeleteFile(":.*"), "invalid filename");
        });

        it("should do nothing when the file to delete is a folder", () => {

            const fso  = make_FSO(),
                  path = "C:\\RootOne\\SubDir1";

            ctx.vfs.AddFolder(path);
            assert.doesNotThrow(() => fso.DeleteFile(path));
            assert.isTrue(ctx.vfs.FolderExists(path));
        });
    });

    describe("#DeleteFolder", () => {

        it("should successfully delete a folder", () => {

            const fso = make_FSO();

            ctx.vfs.AddFolder("C:\\RootOne\\SubDir1");
            assert.isTrue(ctx.vfs.FolderExists("C:\\RootOne\\SubDir1"));

            fso.DeleteFolder("C:\\RootOne\\SubDir1");
            assert.isFalse(ctx.vfs.FolderExists("C:\\RootOne\\SubDir1"));
        });

        it("should delete all folders (empty/not empty) which match PATTERN", () => {

            const fso = make_FSO();

            ctx.vfs.AddFile("C:\\RootOne\\Subdir1\\foo\\bar.txt");
            ctx.vfs.AddFile("C:\\RootOne\\SubDir2\\baz.txt");
            ctx.vfs.AddFolder("C:\\RootOne\\foo");

            assert.isTrue(ctx.vfs.FolderExists("C:\\RootOne\\Subdir1"));
            assert.isTrue(ctx.vfs.FolderExists("C:\\RootOne\\Subdir2"));

            fso.DeleteFolder("C:\\RootOne\\SubDir*");

            assert.isFalse(ctx.vfs.FolderExists("C:\\RootOne\\Subdir1"));
            assert.isFalse(ctx.vfs.FolderExists("C:\\RootOne\\Subdir2"));
        });

        it("should throw 'Path not found' if the folder does not exist", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_path_not_found: () => {
                        throw new Error("no path found");
                    }
                }
            });

            assert.throws(() => fso.DeleteFolder("C:\\Does\\Not\\Exist"), "no path found");
        });

        it("should throw 'Path not found' if the wildcard expr matches zero folders", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_path_not_found: () => {
                        throw new Error("Wildcard matched nothing");
                    }
                }
            });

            ctx.vfs.AddFolder("C:\\RootOne\\SubDir1\\foo");
            ctx.vfs.AddFolder("C:\\RootOne\\SubDir2\\bar");
            ctx.vfs.AddFolder("C:\\RootOne\\SubDir3\\baz");

            assert.throws(() => fso.DeleteFolder("C:\\RootOne\\foo*"), "Wildcard matched nothing");
        });

        it("should handle relative deletes from the CWD of the process", () => {

            const fso = make_FSO();

            ctx.vfs.AddFolder(`${ctx.get_env("path")}\\foo`);
            ctx.vfs.AddFolder(`${ctx.get_env("path")}\\fox`);
            ctx.vfs.AddFolder(`${ctx.get_env("path")}\\bar`);

            fso.DeleteFolder("fo*");

            assert.isFalse(ctx.vfs.FolderExists(`${ctx.get_env("path")}\\foo`));
            assert.isFalse(ctx.vfs.FolderExists(`${ctx.get_env("path")}\\fox`));
            assert.isTrue(ctx.vfs.FolderExists(`${ctx.get_env("path")}\\bar`));

        });

        it("should correctly handle and delete paths which are relative", () => {

            const fso = make_FSO();

            ctx.vfs.AddFolder(`${ctx.get_env("path")}\\foo`);
            ctx.vfs.AddFolder(`${ctx.get_env("path")}\\fox`);
            ctx.vfs.AddFolder(`${ctx.get_env("path")}\\bar`);

            fso.DeleteFolder("../Construct/fo*");

            assert.isFalse(ctx.vfs.FolderExists(`${ctx.get_env("path")}\\foo`));
            assert.isFalse(ctx.vfs.FolderExists(`${ctx.get_env("path")}\\fox`));
            assert.isTrue(ctx.vfs.FolderExists(`${ctx.get_env("path")}\\bar`));
        });

        it("should throw 'invalid procedure call or argument' if path ends in trailing \\", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("path ends with trailing sep");
                    }
                }
            });

            ctx.vfs.AddFolder("C:\\RootOne\\SubDir1");
            assert.throws(() => fso.DeleteFolder("C:\\RootOne\\"), "path ends with trailing sep");
        });
        });

        describe("#DriveExists", () => {

        it("should return true for 'C', 'C:' or 'C:\\'", () => {

        const fso = make_FSO();

        let true_drives  = ["C", "C:", "C:\\", "c:/"],
        false_drives = ["D", "A:\\", ""];

        true_drives.forEach(d => assert.isTrue(fso.DriveExists(d)));
        false_drives.forEach(d => assert.isFalse(fso.DriveExists(d)));
        });
        });

    describe(".Drives", () => {

        it("should return a DrivesCollection object", () => {

            const fso = make_FSO(),
                  dco = fso.Drives;

            assert.equal(dco.count, 1);
            assert.equal(dco.item("c").path, "C:");
        });

        it("should throw if the DrivesCollection property is assigned to", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_unsupported_prop_or_method: () => {
                        throw new Error(".drives is read only");
                    }
                }
            });

            assert.throws(() => fso.Drives = 5, "drives is read only");
        });
    });

    describe("#FileExists", () => {

        it("should return true|false upon file existance", () => {

            const fso = make_FSO();

            ctx.vfs.AddFile("C:\\RootOne\\SubDir1\\foo.txt");
            ctx.vfs.AddFile("C:\\RootOne\\SubDir2\\bar.txt");
            ctx.vfs.AddFile("C:\\RootOne\\SubDir3\\baz.txt");
            ctx.vfs.AddFile(`${ctx.get_env("path")}\\foo.txt`);

            const true_paths = [
                "C:\\RootOne\\SubDir1\\foo.txt",
                "../../RootOne\\SubDir2\\bar.txt",
                "foo.txt"
            ];

            true_paths.forEach(p => assert.isTrue(fso.FileExists(p)));

            const false_paths = [
                "C:\\Foo.txt",
                "C:\\Users\\Construct",
                "C:\\RootOne\\SubDir1\\foo.txt\\",
                "D:\\foo.txt",
                ""
            ];

            false_paths.forEach(p => assert.isFalse(fso.FileExists(p)));
        });

        it("should return false if filespec contains wildcard characters", () => {

            const fso = make_FSO();

            ctx.vfs.AddFile("C:\\RootOne\\foo.txt");
            ctx.vfs.AddFile("C:\\RootOne\\bar.txt");

            assert.isFalse(fso.FileExists("C:\\RootOne\\*.txt"));
        });
    });


    describe("#FolderExists", () => {

        it("should return true|false upon file existance", () => {

            const fso = make_FSO();

            ctx.vfs.AddFile("C:\\RootOne\\SubDir1\\foo.txt");
            ctx.vfs.AddFile("C:\\RootOne\\SubDir2\\bar.txt");
            ctx.vfs.AddFile("C:\\RootOne\\SubDir3\\baz.txt");
            ctx.vfs.AddFile(`${ctx.get_env("path")}\\foo.txt`);
            ctx.vfs.AddFolder(`${ctx.get_env("path")}\\hello`);

            const true_paths = [
                "C:\\RootOne\\SubDir1",
                "C:\\RootOne\\SubDir2\\",
                "../../RootOne\\SubDir2",
                "hello",
                "C:\\",
                "../../../../../"
            ];

            true_paths.forEach(p => assert.isTrue(fso.FolderExists(p)));

            const false_paths = [
                "C:\\RootOne\\SubDir1\\foo.txt",
                "C:\\does\\not\\exist",
            ];

            false_paths.forEach(p => assert.isFalse(fso.FolderExists(p)));
        });

        it("should return false if filespec contains wildcard characters", () => {

            const fso = make_FSO();

            ctx.vfs.AddFile("C:\\RootOne\\SubDir1\\foo.txt");
            ctx.vfs.AddFile("C:\\RootOne\\Subdir2\\bar.txt");

            assert.isFalse(fso.FolderExists("C:\\RootOne\\SubDir*"));
        });
    });

    describe("#GetAbsolutePathName", () => {

        it("should return the drive letter and complete path of CWD if arg is '.'", () => {
            const fso = make_FSO();
            assert.equal(fso.GetAbsolutePathName("."), ctx.get_env("path"));
        });

        it("should return the full path to the parent folder if arg is '..'", () => {
            const fso = make_FSO();
            assert.equal(fso.GetAbsolutePathName(".."), "C:\\Users");
        });

        it("should concat CWD and filename if filename is relative", () => {
            const fso  = make_FSO(),
                  path = `${ctx.get_env("path")}\\foo.txt`;

            ctx.vfs.AddFile(path);
            assert.equal(fso.GetAbsolutePathName("foo.txt"), path);
        });

        it("should allow wildcards anywhere in the path", () => {

            const fso   = make_FSO(),
                  paths = [
                      { in: "C:\\Users\\*\\Desktop\\*", out: "C:\\Users\\*\\Desktop\\*" },
                      { in: "foo.*", out: "C:\\Users\\Construct\\foo.*" },
                      { in: "", out: "C:\\Users\\Construct" }
                  ];

            paths.forEach(p => assert.equal(fso.GetAbsolutePathName(p.in), p.out));
        });

    });

    describe("#GetBaseName", () => {

        it("should return an empty string if the input path is '.'", () => {
            assert.equal((make_FSO()).GetBaseName("."), "");
        });

        it("should return '.' if input string is '..'", () => {
            assert.equal((make_FSO()).GetBaseName(".."), ".");
        });

        it("should strip off the last '.EXT' part of a filename", () => {
            const paths = [
                { in: "C:\\foo.txt", out: "foo" },
                { in: "C:\\*.txt", out: "*" },
                { in: "foo.txt.gz", out: "foo.txt" },
                { in: "foo.", out: "foo" }
            ];

            paths.forEach(p => assert.equal(
                (make_FSO()).GetBaseName(p.in),
                p.out
            ));
        });
    });
    describe("#GetDrive", () => {

        it("should return a Drive object for all valid drivespecs for C:", () => {

            const fso = make_FSO();

            assert.equal((fso.GetDrive("C")).driveletter,    "C");
            assert.equal((fso.GetDrive("C:")).driveletter,   "C");
            assert.equal((fso.GetDrive("C:\\")).driveletter, "C");

            assert.equal((fso.GetDrive("c")).driveletter,    "C");
            assert.equal((fso.GetDrive("c:")).driveletter,   "C");
            assert.equal((fso.GetDrive("c:\\")).driveletter, "C");
        });

        it("should throw 'device unavailable' for inputs which aren't 'C:'", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_device_unavailable: () => {
                        throw new Error("drive not found");
                    }
                }
            });

            const invalid_drives = [
                "a", "a:", "a:\\",
                "b", "b:", "b:\\",
                "x", "x:", "x:\\"
            ];

            invalid_drives.forEach(
                d => assert.throws(() => fso.GetDrive(d), "drive not found")
            );
        });
    });

    describe("#GetDriveName", () => {

        it("should return the correct drive letter for paths", () => {

            const fso   = make_FSO(),
                  paths = [
                      { in: "C:\\foo\\bar", out: "C:" },
                      { in: "foo", out: "" },
                      { in: "", out: "" },
                      { in: "x:", out: "x:" },
                      { in: "X:", out: "X:" },
                      { in: "C:\\", out: "C:" },
                      { in: "C:\\jkkjasuwja", out: "C:" },
                      { in: "1:\\", out: "" }
                  ];

            paths.forEach(p => {
                assert.equal(fso.GetDriveName(p.in), p.out);
            });
        });

        it("should throw if the input is invalid", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("bad input");
                    }
                }
            });

            assert.throws(() => fso.GetDriveName([]), "bad input");
            assert.throws(() => fso.GetDriveName({}), "bad input");
        });
    });



    describe("#GetExtensionName", () => {

        it("should return the correct extensions from a given set of inputs", () => {

            const fso   = make_FSO(),
                  tests = [
                      { in: "C:\\Users\\foo.txt", out: "txt" },
                      { in: "foo", out: "" },
                      { in: "C:\\blah*", out: "" },
                      { in: "test.tar.gz", out: "gz" },
                      { in: "test.TXT", out: "TXT" },
                      { in: "foo.tar.", out: "" },
                      { in: {}, out: "" },
                      { in: [], out: "" },
                      { in: 1, out: "" }
                  ];

            tests.forEach(t => assert.equal(fso.GetExtensionName(t.in), t.out));
        });

        it("should throw if the input is invalid", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_wrong_argc_or_invalid_prop_assign: () => {
                        throw new Error("no input");
                    },
                    throw_invalid_fn_arg: () => {
                        throw new Error("bad input");
                    }
                }
            });

            //assert.throws(() => fso.GetExtensionName(), "no input");

        });
    });

    describe("#GetFile", () => {

        it("should return a File object when the passed file exists", () => {

            const fso  = make_FSO();
            ctx.vfs.AddFile("C:\\foo.txt", "AAAA");

            const file = fso.GetFile("C:\\foo.txt");
            assert.equal(file.name, "foo.txt");
            assert.equal(file.path, "C:\\foo.txt");
            assert.equal(file.OpenAsTextStream().ReadAll(), "AAAA");
        });

        it("should correctly open relative paths when the file exists", () => {

            const fso  = make_FSO(),
                  path1 = `${ctx.get_env("path")}\\foo.txt`,
                  path2 = `C:\\Users\\bar.txt`,
                  path3 = `${ctx.get_env("path")}\\7`;

            ctx.vfs.AddFile(path1, "AAAA");
            {
                let file = fso.GetFile("foo.txt");
                assert.equal(file.name, "foo.txt");
                assert.equal(file.path, path1);
            }
            {
                let file = fso.GetFile("C:foo.txt");
                assert.equal(file.name, "foo.txt");
                assert.equal(file.path, path1);
            }

            ctx.vfs.AddFile(path2, "BBBB");
            {
                let file = fso.GetFile("../bar.txt");
                assert.equal(file.name, "bar.txt");
                assert.equal(file.path, path2);
            }

            ctx.vfs.AddFile(path3, "CCCC");
            {
                let file = fso.GetFile(7);
                assert.equal(file.name, "7");
                assert.equal(file.path, path3);
            }
        });

        it("should throw if the method inputs are illegal", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("bad input");
                    }
                }
            });

            const inputs = [
                undefined,
                ""
            ];

            inputs.forEach(i => assert.throws(() => fso.GetFile(i), "bad input"));
        });

        it("should throw 'File not found' if the given path contains wildcards", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_file_not_found: () => {
                        throw new Error("no wildcards");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\foo.txt", "AAAA");
            assert.throws(() => fso.GetFile("C:\\*.txt"), "no wildcards");
        });

        it("should throw 'File not found' when filepath is a folder", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_file_not_found: () => {
                        throw new Error("is folder");
                    }
                }
            });

            ctx.vfs.AddFolder("C:\\foo");
            assert.throws(() => fso.GetFile("C:\\foo"), "is folder");
        });

        it("should open a SFN path correctly", () => {

            const fso = make_FSO();
            ctx.vfs.AddFile("C:\\SubDirectory\\helloworld.txt", "hello world");

            const file = fso.GetFile("C:\\SUBDIR~1\\HELLOW~1.TXT");

            assert.equal(file.name, "HELLOW~1.TXT");
            assert.equal(file.path, "C:\\SUBDIR~1\\HELLOW~1.TXT");
        });

        it("should throw 'File not found' when the file does not exist", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_file_not_found: () => {
                        throw new Error("file not exists");
                    }
                }
            });

            assert.throws(() => fso.GetFile("C:\\not_exists.txt"), "file not exists");
        });
    });

    describe("#GetFileName", () => {

        it("should correctly return filenames", () => {

            const fso   = make_FSO(),
                  tests = [
                      { in: "",                      out: "" },
                      { in: " ",                     out: "" },
                      { in: "*.txt",                 out: "*.txt" },
                      { in: "C:\\foo\\",             out: "foo" },
                      { in: "C:\\foo",               out: "foo" },
                      { in: "../",                   out: ".." },
                      { in: "../.",                  out: "." },
                      { in: "C:",                    out: "" },
                      { in: "C:\\",                  out: "" },
                      { in: "C:\\foo\\bar\\abc.txt", out: "abc.txt" },
                      { in: undefined,               out: "" }
                  ];

            tests.forEach(t => assert.equal(fso.GetFileName(t.in), t.out));
        });

        it("should throw appropriate exceptions certain inputs", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_type_mismatch: () => {
                        throw new Error("type mismatch");
                    },
                    throw_wrong_argc_or_invalid_prop_assign: () => {
                        throw new Error("bad arg");
                    }
                }
            });

            assert.throws(() => fso.GetFileName(), "bad arg");
            assert.throws(() => fso.GetFileName(null), "type mismatch");
        });
    });

    describe("#GetFileVersion", () => {

        it("should return an empty string for files which exist", () => {

            const fso = make_FSO();
            ctx.vfs.AddFile("C:\\foo.dll");
            assert.equal(fso.GetFileVersion("C:\\foo.dll"), "");
        });

        it("should throw an error if the file cannot be found", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_error: () => {
                        throw new Error("not found");
                    }
                }
            });

            assert.throws(() => fso.GetFileVersion("C:\\foo.dll"), "not found");
            assert.throws(() => fso.GetFileVersion("C:\\*.txt"), "not found");
        });
    });

    describe("#GetFolder", () => {

        it("should get a folder with an absolute path", () => {
            const fso = make_FSO();
            ctx.vfs.AddFolder("C:\\RootOne\\SubDir1");
            assert.equal(fso.GetFolder("C:\\RootOne").name, "RootOne");
        });

        it("should get a folder with a relative path", () => {
            const fso     = make_FSO(),
                  relpath = `${ctx.get_env("path")}\\foo\\bar`;

            ctx.vfs.AddFolder(relpath);
            assert.equal(fso.getfolder("foo").name, "foo");
            assert.equal(fso.getfolder("C:foo").name, "foo");
            assert.equal(fso.getFolder("foo").ParentFolder.name, "Construct");
        });

        it("should throw 'Path not found' if the folder does not exist", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_path_not_found: () => {
                        throw new Error("path not found");
                    }
                }
            });

            assert.throws(() => fso.GetFolder("C:\\bogus"), "path not found");
        });

        it("should throw if the folder is a file", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_path_not_found: () => {
                        throw new Error("path is file");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\RootOne\\foo.txt", "hello world");
            assert.throws(() => fso.GetFolder("C:\\RootOne\\foo.txt"), "path is file");
        });

        it("should open a short filepath successfully", () => {
            const fso = make_FSO();
            ctx.vfs.AddFolder("C:\\Subdirectory\\HelloWorld");
            assert.equal(fso.GetFolder("C:\\SUBDIR~1\\HELLOW~1").name, "HELLOW~1");
        });

        it("should throw if no inputs are passed", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_wrong_argc_or_invalid_prop_assign: () => {
                        throw new Error("no input");
                    }
                }
            });

            assert.throws(() => fso.GetFolder(), "no input");
        });

        it("should throw if inputs are illegal", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("invalid arg");
                    }
                }
            });

            const invalid_inputs = [
                "", []
            ];

            invalid_inputs.forEach((input) => {
                assert.throws(() => fso.GetFolder(input), "invalid arg");
            });
        });

        it("should correctly handle cases where 'C:\' is the requested folder", () => {

            const fso = make_FSO();

            assert.doesNotThrow(() => fso.GetFolder("C:\\"));
            assert.equal(fso.GetFolder("C:\\").name, "");
            assert.equal(fso.GetFolder("C:\\").path, "C:\\");

            // Relative path!
            assert.equal(fso.GetFolder("C:").path, ctx.get_env("path"));
        });
    });

    describe("#GetParentFolderName", () => {

        it("should return the correct parent folder name for a given input", () => {

            const fso   = make_FSO(),
                  paths = [
                      { in: "C:\\foo", out: "C:\\" },
                      { in: "C:\\foo\\bar\\baz", out: "C:\\foo\\bar" },
                      { in: "C:", out: "" },
                      { in: "C:\\", out: "" },
                      { in: "foobar", out: "" },
                      { in: "/var/log/blah", out: "/var/log" },
                      { in: "../foo", out: ".." },
                  ];

            paths.forEach(p => assert.equal(fso.GetParentFolderName(p.in), p.out));
        });
    });

    describe("#GetSpecialFolders", () => {

        it("should fetch the 'C:\\Windows' folder when given 0", () => {

            const fso     = make_FSO(),
                  win_dir = fso.GetSpecialFolder(0);

            assert.equal(win_dir.name, "Windows");
            assert.equal(win_dir.path, "C:\\Windows");
        });

        it("should fetch the 'C:\\Windows\\System32' folder when given 1", () => {

            const fso     = make_FSO(),
                  win_dir = fso.GetSpecialFolder(1);

            assert.equal(win_dir.name, "System32");
            assert.equal(win_dir.path, "C:\\Windows\\System32");
        });

        it("should fetch the user's Temp folder when given 2", () => {

            const fso     = make_FSO(),
                  win_dir = fso.GetSpecialFolder(2);

            assert.equal(win_dir.name, "Temp");
            assert.equal(win_dir.path, "C:\\Users\\Construct\\AppData\\Local\\Temp");
        });

        it("should fetch the correct dir when the input is string|number", () => {

            const fso = make_FSO();

            assert.equal(fso.GetSpecialFolder("0").path, "C:\\Windows");
            assert.equal(fso.GetSpecialFolder("1").path, "C:\\Windows\\System32");
            assert.equal(fso.GetSpecialFolder("2").path, "C:\\Users\\Construct\\AppData\\Local\\Temp");
        });

        it("should throw when called with zero arguments", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_wrong_argc_or_invalid_prop_assign: () => {
                        throw new Error("no inputs");
                    }
                }
            });

            assert.throws(() => fso.GetSpecialFolder(), "no inputs");
        });

        it("should throw a 'type mismatch' exception for the following inputs", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_type_mismatch: () => {
                        throw new Error("type mismatch");
                    }
                }
            });

            assert.throws(() => fso.GetSpecialFolder(null), "type mismatch");
            assert.throws(() => fso.GetSpecialFolder([]),   "type mismatch");
        });

        it("should coerce 'undefined' to '0' and return the 'C:\\Windows' folder.", () => {

            const fso = make_FSO();

            assert.doesNotThrow(() => fso.GetSpecialFolder(undefined));
            assert.equal(fso.GetSpecialFolder(undefined).path, "C:\\Windows");
        });

        it("should coerce 'false' to '0' and return the 'C:\\Windows' folder.", () => {

            const fso = make_FSO();

            assert.doesNotThrow(() => fso.GetSpecialFolder(false));
            assert.equal(fso.GetSpecialFolder(false).path, "C:\\Windows");
        });

        it("should throw 'invalid procedure call or argument' for unknown constants", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("invalid argument");
                    }
                }
            });

            assert.throws(() => fso.GetSpecialFolder(-1), "invalid argument");
        });

    });

    describe("GetStandardstream", () => {

        const STDIN  = 0,
              STDOUT = 1,
              STDERR = 2;

        it("should return the STDIN stream", (done) => {

            const fso = make_FSO({
                streams: {
                    stdin: {
                        Read: () => {
                            assert.isTrue(true);
                            done();
                        }
                    }
                }
            });

            assert.doesNotThrow(() => fso.GetStandardStream(STDIN).Read());
        });

        it("should return the STDOUT stream", (done) => {

            const fso = make_FSO({
                streams: {
                    stdout: {
                        Write: (msg) => {
                            assert.equal(msg, "stdout stream");
                            done();
                        }
                    }
                }
            });

            assert.doesNotThrow(() => fso.GetStandardStream(STDOUT).Write("stdout stream"));
        });

        it("should return the STDERR stream", (done) => {

            const fso = make_FSO({
                streams: {
                    stderr: {
                        Write: (msg) => {
                            assert.equal(msg, "stderr stream");
                            done();
                        }
                    }
                }
            });

            assert.doesNotThrow(() => fso.GetStandardStream(STDERR).Write("stderr stream"));
        });

        it("should throw if the stream selector is numeric but not known", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_range_error: () => {
                        throw new Error("out of range");
                    }
                }
            });

            assert.throws(() => fso.GetStandardStream(-1),  "out of range");
            assert.throws(() => fso.GetStandardStream(3),   "out of range");
            assert.throws(() => fso.GetStandardStream(100), "out of range");
        });

        it("should throw 'bad file mode' if the input is 'false' or undefined", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_bad_file_mode: () => {
                        throw new Error("bad file mode");
                    }
                }
            });

            assert.throws(() => fso.GetStandardStream(false), "bad file mode");
            assert.throws(() => fso.GetStandardStream(undefined), "bad file mode");
        });

        it("should throw 'type mismatch' when given null, [], {}", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_type_mismatch: () => {
                        throw new Error("type mismatch");
                    }
                }
            });

            assert.throws(() => fso.GetStandardStream(null), "type mismatch");
            assert.throws(() => fso.GetStandardStream([]),   "type mismatch");
            assert.throws(() => fso.GetStandardStream({}),   "type mismatch");
        });


    });

    describe("#GetTempName", () => {

        it("should generate a PRNG temp name", () => {
            const fso = make_FSO();
            assert.match(fso.GetTempName(), /^[a-z]{3}[a-f0-9]{5}\.tmp$/i);
            assert.match(fso.GetTempName(), /^[a-z]{3}[a-f0-9]{5}\.tmp$/i);
            assert.match(fso.GetTempName(), /^[a-z]{3}[a-f0-9]{5}\.tmp$/i);
            assert.match(fso.GetTempName(), /^[a-z]{3}[a-f0-9]{5}\.tmp$/i);
        });

        it("should throw if args are passed to GetTempName()", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_wrong_argc_or_invalid_prop_assign: () => {
                        throw new Error("invalid arg");
                    }
                }
            });

            assert.throws(() => fso.GetTempName(1), "invalid arg");
        });
    });

    describe("#MoveFile", () => {

        it("should move a single file from dirA to dirB", () => {

            const fso = make_FSO();
            ctx.vfs.AddFile("C:\\dirA\\foo.txt");
            ctx.vfs.AddFolder("C:\\dirB");

            assert.isFalse(ctx.vfs.FileExists("C:\\dirB\\foo.txt"));

            assert.doesNotThrow(() => fso.MoveFile("C:\\dirA\\foo.txt", "C:\\dirB\\foo.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\dirB\\foo.txt"));
            assert.isFalse(ctx.vfs.FileExists("C:\\dirA\\foo.txt"));
        });

        it("should move files up to the root-volume location", () => {

            const fso = make_FSO();
            ctx.vfs.AddFile("C:\\dirA\\foo.txt");

            assert.isFalse(ctx.vfs.Exists("C:\\foo.txt"));
            assert.doesNotThrow(() => fso.MoveFile("C:\\dirA\\foo.txt", "C:\\"));
            assert.isTrue(ctx.vfs.FileExists("C:\\foo.txt"));
        });

        it("should move a single file from the root volume", () => {

            const fso = make_FSO();
            ctx.vfs.AddFile("C:\\foo.txt");
            ctx.vfs.AddFolder("C:\\dirA");

            assert.isFalse(ctx.vfs.Exists("C:\\dirA\\foo.txt"));
            assert.doesNotThrow(() => fso.MoveFile("C:\\foo.txt", "C:\\dirA\\"));
            assert.isTrue(ctx.vfs.FileExists("C:\\dirA\\foo.txt"));
        });

        it("should move multiple files from the root volume to another dir", () => {

            const fso = make_FSO();
            ctx.vfs.AddFile("C:\\foo.txt");
            ctx.vfs.AddFile("C:\\bar.txt");
            ctx.vfs.AddFile("C:\\baz.txt");

            ctx.vfs.AddFolder("C:\\dirA");

            assert.doesNotThrow(() => fso.MoveFile("C:\\*.txt", "C:\\dirA"));
            assert.isTrue(ctx.vfs.FileExists("C:\\dirA\\foo.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\dirA\\bar.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\dirA\\baz.txt"));
        });

        it("should move a file from C:\foo.txt to C:\bar.txt.", () => {

            const fso = make_FSO();
            ctx.vfs.AddFile("C:\\foo.txt");

            assert.doesNotThrow(() => fso.MoveFile("C:\\foo.txt", "C:\\bar.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\bar.txt"));
            assert.isFalse(ctx.vfs.FileExists("C:\\foo.txt"));
        });

        it("should use process working dir for relative paths", () => {

            const fso = make_FSO(),
                  src = `${ctx.get_env("path")}\\aaa.txt`,
                  dst = `${ctx.get_env("path")}\\bbb.txt`;

            ctx.vfs.AddFile(src);
            assert.isFalse(ctx.vfs.FileExists(dst));

            fso.MoveFile("aaa.txt", "bbb.txt");
            assert.isTrue(ctx.vfs.FileExists(dst));
            assert.isFalse(ctx.vfs.FileExists(src));
        });

        it("should follow '../' in relative paths", () => {

            const fso = make_FSO(),
                  src = `C:\\Users\\aaa.txt`,
                  dst = `${ctx.get_env("path")}\\bbb.txt`;

            ctx.vfs.AddFile(src);
            assert.isFalse(ctx.vfs.FileExists(dst));

            fso.MoveFile("..\\aaa.txt", "bbb.txt");
            assert.isTrue(ctx.vfs.FileExists(dst));
            assert.isFalse(ctx.vfs.FileExists(src));
        });

        it("should consider 'c:file.txt' a relative path and move accordingly", () => {

            const fso = make_FSO();
            ctx.vfs.AddFile("C:\\Users\\Construct\\foo.txt");

            assert.isTrue(ctx.vfs.FileExists("C:\\Users\\Construct\\foo.txt"));
            assert.isFalse(ctx.vfs.FileExists("C:\\Users\\Construct\\bar.txt"));

            assert.doesNotThrow(() => fso.MoveFile("C:foo.txt", "C:bar.txt"));

            assert.isFalse(ctx.vfs.FileExists("C:\\Users\\Construct\\foo.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\Users\\Construct\\bar.txt"));
        });

        it("should move the file when dest ends in pathsep.", () => {

            const fso = make_FSO();
            ctx.vfs.AddFile("C:\\dirA\\foo.txt");
            ctx.vfs.AddFolder("C:\\dirB");

            assert.isFalse(ctx.vfs.FileExists("C:\\dirB\\foo.txt"));
            assert.doesNotThrow(() => fso.movefile("C:\\dirA\\foo.txt", "C:\\dirB\\"));

            assert.isFalse(ctx.vfs.FileExists("C:\\dirA\\foo.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\dirB\\foo.txt"));
        });

        it("should move all files matching a wildcard expression.", () => {

            const fso = make_FSO();
            ctx.vfs.AddFile("C:\\dirA\\foo.txt");
            ctx.vfs.AddFile("C:\\dirA\\bar.txt");
            ctx.vfs.AddFile("C:\\dirA\\baz.zip");
            ctx.vfs.AddFolder("C:\\dirB");

            assert.isFalse(ctx.vfs.FileExists("C:\\dirB\\foo.txt"));
            assert.isFalse(ctx.vfs.FileExists("C:\\dirB\\bar.txt"));
            assert.isFalse(ctx.vfs.FileExists("C:\\dirB\\baz.zip"));

            fso.MoveFile("C:\\dirA\\*.txt", "C:\\dirB\\");

            assert.isTrue(ctx.vfs.FileExists("C:\\dirB\\foo.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\dirB\\bar.txt"));
            assert.isFalse(ctx.vfs.FileExists("C:\\dirB\\baz.zip"));
        });

        it("should match a single file matching a wildcard expression", () => {

            const fso = make_FSO();
            ctx.vfs.AddFile("C:\\dirA\\foo.txt");
            ctx.vfs.AddFolder("C:\\dirB");

            assert.isFalse(ctx.vfs.FileExists("C:\\dirB\\foo.txt"));

            fso.MoveFile("C:\\dirA\\*.txt", "C:\\dirB");

            assert.isTrue(ctx.vfs.FileExists("C:\\dirB\\foo.txt"));
            assert.isFalse(ctx.vfs.FileExists("C:\\dirA\\foo.txt"));
        });

         it("should throw when moving a single file and dest does not end in pathsep", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_file_already_exists: () => {
                        throw new Error("no trailing pathsep");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\dirA\\foo.txt");
            ctx.vfs.AddFolder("C:\\dirB");

            assert.throws(
                () => fso.MoveFile("C:\\dirA\\foo.txt", "C:\\dirB"),
                "no trailing pathsep"
            );
        });

        it("should throw 'file already exists' when the destination file already exists.", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_file_already_exists: () => {
                        throw new Error("dstfile exists");
                    }
                }
            });

            const src = "C:\\dirA\\foo.txt",
                  dst = "C:\\dirB\\bar.txt";

            ctx.vfs.AddFile(src);
            ctx.vfs.AddFile(dst);

            assert.throws(() => fso.MoveFile(src, dst), "dstfile exists");
        });

        it("should not require destination to end in a trailing pathsep when src is wildcard", () => {

            const fso = make_FSO();

            ctx.vfs.AddFile("C:\\dirA\\foo.txt");
            ctx.vfs.AddFile("C:\\dirA\\bar.txt");
            ctx.vfs.AddFile("C:\\dirA\\baz.zip");
            ctx.vfs.AddFolder("C:\\dirB");

            assert.doesNotThrow(() => fso.MoveFile("C:\\dirA\\*.txt", "C:\\dirB"));

            assert.isTrue(ctx.vfs.FileExists("C:\\dirB\\foo.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\dirB\\bar.txt"));

            assert.isFalse(ctx.vfs.FileExists("C:\\dirA\\foo.txt"));
            assert.isFalse(ctx.vfs.FileExists("C:\\dirA\\bar.txt"));
        });

         it("should move files until a dest file exists and then stop", () => {

             const fso = make_FSO({
                 exceptions: {
                     throw_file_exists: () => {
                         throw new Error("dest file exists");
                     }
                 }
             });

             ctx.vfs.AddFile("C:\\dirA\\bar.txt");
             ctx.vfs.AddFile("C:\\dirA\\baz.txt");
             ctx.vfs.AddFile("C:\\dirA\\foo.txt");
             ctx.vfs.AddFile("C:\\dirB\\foo.txt");

             assert.throws(() => fso.MoveFile("C:\\dirA\\*.txt", "C:\\dirB"), "dest file exists");

             assert.isTrue(ctx.vfs.FileExists("C:\\dirA\\foo.txt"));

             assert.isTrue(ctx.vfs.FileExists("C:\\dirB\\bar.txt"));
             assert.isTrue(ctx.vfs.FileExists("C:\\dirB\\baz.txt"));

             assert.isFalse(ctx.vfs.FileExists("C:\\dirA\\bar.txt"));
             assert.isFalse(ctx.vfs.FileExists("C:\\dirA\\baz.txt"));
         });

        it("should throw invalid proc call if destination contains wildcards", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("no wildcards in dstpath");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\dirA\\foo.txt");
            ctx.vfs.AddFolder("C:\\dirB\\SubDir1");

            assert.throws(
                () => fso.MoveFile("C:\\dirA\\foo.txt", "C:\\dir*\\SubDir1\\bar.txt"),
                "no wildcards in dstpath"
            );

        });

        it("should throw invalid proc call if source parent path contains wildcards", () => {

            const fso = make_FSO({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("no wildcards in parent src");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\dirA\\SubDir1\\foo.txt");
            ctx.vfs.AddFolder("C:\\dirB\\SubDir1");

            assert.throws(
                () => fso.MoveFile("C:\\dirA\\*\\foo.txt", "C:\\dirB\\"),
                "no wildcards in parent src"
            );
        });
    });


    const NOOP = () => {};
    xdescribe("#MoveFolder", NOOP);
    xdescribe("#OpenTextfile", NOOP);
});
