const assert = require("chai").assert;
const VirtualFileSystem = require("../../src/runtime/virtfs");

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

    let new_ctx = Object.assign({}, context, opts);

    return new VirtualFileSystem(new_ctx);
}

describe("Virtual File System", () => {

    describe("Long and short filename handling", () => {

        it("should return the shortname of a longname", () => {

            const vfs = make_vfs();

            vfs.AddFolder("C:\\HelloWorld");
            assert.isTrue(vfs.FolderExists("C:\\HelloWorld"));
            assert.isTrue(vfs.FolderExists("C:\\HELLOW~1"));

            assert.equal(vfs.GetShortName("C:\\HelloWorld"), "HELLOW~1");

        });

        it("should return the correct filename case when the file is already a SFN", () => {

            const vfs = make_vfs();

            vfs.AddFolder("C:\\RootOne\\foo");
            assert.equal(vfs.GetShortName("C:\\RootOne\\foo"), "foo");
        });

        it("should not create links for files which are already valid 8.3 names", () => {

            const vfs  = make_vfs(),
                  path = "C:\\foo\\bar\\baz.txt";

            vfs.AddFile(path);

            assert.equal(vfs.GetShortName(path), "baz.txt");
            assert.equal(vfs.GetShortName("C:\\foo\\bar"), "bar");
            assert.equal(vfs.GetShortName("C:\\foo"), "foo");
            assert.equal(vfs.GetShortName("C:\\"), "");
        });

        it("should return a folder when using a shortname path", () => {

            const vfs = make_vfs();

            assert.isFalse(vfs.FolderExists("C:\\HELLOW~1"));

            vfs.AddFolder("C:\\HelloWorld");
            assert.isTrue(vfs.FolderExists("C:\\HELLOW~1"));
            assert.isTrue(vfs.FolderExists("C:\\HelloWorld"));
        });

        it("should return a folder when mixing long and shortnames", () => {

            const vfs = make_vfs();
            const lfn = "C:\\HelloWorld\\testing123";

            assert.isFalse(vfs.FolderExists(lfn));
            vfs.AddFolder(lfn);
            assert.isTrue(vfs.FolderExists(lfn));

            assert.isTrue(vfs.FolderExists("C:\\HELLOW~1"));
            assert.isTrue(vfs.FolderExists("C:\\HELLOW~1\\testing123"));
        });
    });

    describe("#ShortPath", () => {

        it("should support returning a complete path to a file or folder in DOS 8.3 format", () => {

            const vfs  = make_vfs(),
                  path = "C:\\HelloWorld\\Longfilename\\foobarbaz\\longtextfile.txt";

            vfs.AddFile(path);
            assert.equal(vfs.ShortPath(path), "C:\\HELLOW~1\\LONGFI~1\\FOOBAR~1\\LONGTE~1.TXT");
        });

        it("should return a normal path if all parts are already short", () => {

            const vfs = make_vfs(),
                  path = "C:\\foo\\bar\\baz.txt";

            vfs.AddFile(path);
            assert.equal(vfs.ShortPath(path), path);
        });
    });

    describe("ConvertShortPathToLongPath", () => {

        it("should correctly convert short parts in a path to equal LFN names", () => {

            const vfs = make_vfs();

            vfs.AddFile("C:\\FooBarBaz\\HelloWorld.txt");

            assert.equal(
                vfs.ConvertShortPathToLongPath("C:\\FOOBAR~1\\HELLOW~1.TXT"),
                "c:\\foobarbaz\\helloworld.txt"
            );
        });

        it("should return false if the path is valid but files matching SFN don't exist", () => {

            const vfs = make_vfs(),
                  path = "C:\\FOOBAR~1\\HELLOW~1.TXT";
            assert.equal(vfs.ConvertShortPathToLongPath(path), path.toLowerCase());
        });
    });

    describe("Environment variables", () => {

        it("should correctly expand environment variables", () => {

            const vfs = make_vfs({
                environment: {
                    foo: "FOO!",
                    bar: "BAR!",
                    baz: "BAZ!"
                }
            });

            let tests = [
                {
                    input: "Hello %foo% bar %BaR% %baz %BAZ% world...",
                    output: "Hello FOO! bar BAR! %baz BAZ! world..."
                },
                {
                    input:  " %FOO% %foo% %Foo% %fOO% ",
                    output: " FOO! FOO! FOO! FOO! "
                },
                {
                    input: "there are foo baz bar no bar environment vars here",
                    output: "there are foo baz bar no bar environment vars here"
                }
            ];

            tests.forEach(t => assert.equal(vfs.ExpandEnvironmentStrings(t.input), t.output));
        });
    });

    describe("Paths", () => {

        describe("Building paths...", () => {

            it("should correctly construct paths", () => {

                const vfs = make_vfs();

                let tests = [
                    {
                        input: ["C:", "foo.txt"],
                        output: "C:foo.txt"
                    },
                    {
                        input: ["C:..", "foo.txt"],
                        output: "C:..\\foo.txt"
                    },
                    {
                        input: ["C:/Users/Construct/Desktop/", "foo.txt"],
                        output: "C:/Users/Construct/Desktop/foo.txt"
                    },
                    {
                        input: ["C:/Users/Construct/Desktop", "foo.txt"],
                        output: "C:/Users/Construct/Desktop\\foo.txt"
                    },
                    {
                        input: ["C:/Users/Construct/Desktop/..", "foo.txt"],
                        output: "C:/Users/Construct/Desktop/..\\foo.txt"
                    },
                    {
                        input: ["C:\\Users\\Construct\\Desktop\\..\\..\\", "foo.txt"],
                        output: "C:\\Users\\Construct\\Desktop\\..\\..\\foo.txt"
                    }
                ];

                tests.forEach(
                    t => assert.equal(
                        vfs.BuildPath(t.input[0], t.input[1]),
                        t.output
                    )
                );
            });
        });

        it("should identify absolute paths", () => {

            const vfs = make_vfs();

            const list_of_abs_paths = [
                "\\\\?\\C:\\foo\\bar.txt",
                "\\\\unc",
                "C:\\foo.txt",
                "C:\\bar\\baz.txt"
            ];

            list_of_abs_paths.forEach(
                p => assert.isTrue(vfs.PathIsAbsolute(p))
            );
        });

        it("should identify relative paths", () => {

            const vfs = make_vfs();

            const list_of_rel_paths = [
                "C:foo.txt",
                "d:..\bar.txt",
                "..\foo\bar.txt",
                "foo.txt",
                "..\\bar/baz.txt",
                "..\..\..\..\a.txt"
            ];

            list_of_rel_paths.forEach(
                p => assert.isTrue(vfs.PathIsRelative(p))
            );
        });

        describe("Path Parser", () => {

            it("should parse paths correctly", () => {

                const vfs = make_vfs();

                assert.deepEqual(
                    vfs.Parse("C:\\Users\\Construct\\file.txt"),
                    {
                        dir: "C:\\Users\\Construct",
                        base: "file.txt",
                        ext:  ".txt",
                        name: "file",
                        root: "C:\\"
                    }
                );

            });
        });

        // Path Expansion

        describe("Path Resolver", () => {

            it("should correctly resolve relative paths", () => {

                const vfs = make_vfs({
                    environment: {
                        "appdata": "C:\\Users\\Construct\\AppData\\Roaming"
                    }
                });

                // Default path is: "C:\Users\Construct".
                let paths = [
                    {
                        input: "C:foo.txt",
                        output: "C:\\Users\\Construct\\foo.txt"
                    },
                    {
                        input:  "foo.txt",
                        output: "C:\\Users\\Construct\\foo.txt"
                    },
                    {
                        input: "../foo.txt",
                        output: "C:\\Users\\foo.txt"
                    },
                    {
                        input: "../Construct/Desktop/.././Desktop/foo.txt",
                        output: "C:\\Users\\Construct\\Desktop\\foo.txt"
                    },
                    {
                        input: ".\\foo.txt",
                        output: "C:\\Users\\Construct\\foo.txt"
                    },
                    {
                        input: "../OtherUser/foo.txt",
                        output: "C:\\Users\\OtherUser\\foo.txt"
                    },
                    {
                        input: "%appdata%\\foo.txt",
                        output: "C:\\Users\\Construct\\AppData\\Roaming\\foo.txt"
                    },
                    {
                        input: "%appdata%",
                        output: "C:\\Users\\Construct\\AppData\\Roaming"
                    },
                    {
                        input: "test/",
                        output: "C:\\Users\\Construct\\test\\"
                    },
                    {
                        input: "./test",
                        output: "C:\\Users\\Construct\\test"
                    },
                    {
                        // This odd behaviour is caveated in
                        // virtfs.js.  We don't support different disk
                        // designators (at this time).
                        input: "f:test.txt",
                        output: "C:\\Users\\Construct\\test.txt"
                    }
                ];

                paths.forEach(p => assert.equal(vfs.Resolve(p.input), p.output));
            });

            it("should correctly handle absolute paths", () => {

                const vfs = make_vfs({
                    environment: {
                        appdata: "C:\\Users\\Construct\\AppData\\Roaming"
                    }
                });

                let paths = [
                    {
                        input: "C:\\Users\\Construct\\Desktop\\blah\\..\\..\\foo.txt",
                        output: "C:\\Users\\Construct\\foo.txt"
                    },
                    {
                        input: "C:\\Users\\Construct\\Desktop\\foo.txt",
                        output: "C:\\Users\\Construct\\Desktop\\foo.txt"
                    }
                ];

                paths.forEach(p => assert.equal(vfs.Resolve(p.input), p.output));
            });
        });
    });

    describe("File and folder existence", () => {

        describe("#FileExists", () => {

            it("should return true if the file exists", () => {
                const vfs = make_vfs();
                vfs.AddFile("C:\\Users\\Construct\\test.txt", "Hello, World!");
                assert.isTrue(vfs.FileExists("C:\\Users\\Construct\\test.txt"));
            });

            it("should return false if the file does not exist", () => {
                const vfs = make_vfs();
                assert.isFalse(vfs.FileExists("C:\\Users\\Blah\\foo.txt"));
            });
        });

        describe("#FolderExists", () => {

            it("should return true if the folder exists", () => {

                const vfs = make_vfs();

                assert.isFalse(vfs.FolderExists("C:\\Users\\Construct\\HELLO"));
                vfs.AddFolder("C:\\Users\\Construct\\HELLO");
                assert.isTrue(vfs.FolderExists("C:\\Users\\Construct\\HELLO"));
            });
        });
     });

    describe("File manipulations", () => {

        describe("#AddFile", () => {

            it("should support creating a new file", () => {

                const vfs = make_vfs();

                assert.isFalse(vfs.FileExists("C:\\Users\\Construct\\test.txt"));
                vfs.AddFile("C:\\Users\\Construct\\test.txt", "Hello, World!");
                assert.isTrue(vfs.FileExists("C:\\Users\\Construct\\test.txt"));
            });

            it("should add a file and create a symlink shortname", () => {

                const vfs = make_vfs();

                assert.isFalse(vfs.FileExists("C:\\Users\\Construct\\HelloWorld.txt"));
                assert.isFalse(vfs.FileExists("C:\\Users\\Construct\\HELLOW~1.txt"));

                vfs.AddFile("C:\\Users\\Construct\\HelloWorld.txt", "ABCD");

                assert.isTrue(vfs.FileExists("C:\\Users\\Construct\\HelloWorld.txt"));
                assert.isTrue(vfs.FileExists("C:\\Users\\Construct\\HELLOW~1.txt"));

            });

            it("should allow overwriting contents using #AddFile with existing file", () => {

                const vfs = make_vfs();

                vfs.AddFile("C:\\HelloWorld\\LongFilename.txt", "source");

                assert.equal(
                    vfs.ReadFileContents("C:\\HelloWorld\\LongFilename.txt", "ascii"),
                    "source"
                );

                // Should workwith SFNs also
                assert.equal(
                    vfs.ReadFileContents("C:\\HELLOW~1\\LONGFI~1.TXT", "ascii"),
                    "source"
                );

                // !!!!!
                // OVERWRITE CONTENTS
                // !!!!!
                vfs.AddFile("C:\\HelloWorld\\LongFilename.txt", "testing2");

                assert.equal(
                    vfs.ReadFileContents("C:\\HelloWorld\\LongFilename.txt", "ascii"),
                    "testing2"
                );

                assert.equal(
                    vfs.ReadFileContents("C:\\HELLOW~1\\LONGFI~1.TXT", "ascii"),
                    "testing2"
                );
            });

            it("should throw if the filename is invalid", () => {
                const vfs = make_vfs();
                assert.throws(() => vfs.AddFile("foo*.txt"), "Invalid filepath");
            });
        });

        describe("#CopyFile", () => {

            it("should copy a file from one location to another", () => {

                const vfs = make_vfs();

                vfs.AddFile("C:\\Users\\Construct\\Desktop\\foo.txt", "Hello, World!");
                assert.isFalse(vfs.FileExists("C:\\Users\\Construct\\Desktop\\bar.txt"));
                vfs.CopyFile(
                    "C:\\Users\\Construct\\Desktop\\foo.txt",
                    "C:\\Users\\Construct\\Desktop\\bar.txt"
                );
                assert.isTrue(vfs.FileExists("C:\\Users\\Construct\\Desktop\\bar.txt"));
            });

            it("should ignore case when copying files", () => {

                const vfs = make_vfs();

                vfs.AddFile("C:\\USERS\\CONSTRUCT\\DESKTOP\\FOO.TXT", "HELLO WORLD!");
                vfs.CopyFile("c:\\users\\construct\\desktop\\foo.txt",
                             "C:\\USERS\\CONSTRUCT\\DESKTOP\\BAR.txt");

                assert.isTrue(vfs.FileExists("c:\\users\\construct\\desktop\\BAR.txt"));
            });


            it("should overwrite an existing file by default", () => {

                const vfs = make_vfs();

                vfs.AddFile("C:\\Users\\Construct\\Desktop\\foo.txt", "Hello, World!");
                vfs.AddFile("C:\\Users\\Construct\\Desktop\\bar.txt", "1234567890");

                vfs.CopyFile(
                    "C:\\Users\\Construct\\Desktop\\foo.txt",
                    "C:\\Users\\Construct\\Desktop\\bar.txt"
                );

                assert.deepEqual(
                    vfs.ReadFileContents("C:\\Users\\Construct\\Desktop\\bar.txt", "ascii"),
                    "Hello, World!"
                );
            });

            it("should throw if trying to copy a file while the destination filename exists", () => {

                const vfs = make_vfs();

                vfs.AddFile("C:\\foo.txt", "Foobar!");
                vfs.AddFile("C:\\bar.txt", "Barbaz!");

                assert.throws(
                    () => vfs.CopyFile("C:\\foo.txt", "C:\\bar.txt", { overwrite: false }),
                    "EEXIST: file already exists"
                );
            });
        });

        describe("#Delete", () => {

            it("should support deleting a file", () => {

                const vfs = make_vfs();

                vfs.AddFile("C:\\foo.txt", "Hello");
                assert.isTrue(vfs.FileExists("C:\\foo.txt"));

                vfs.Delete("C:\\foo.txt");
                assert.isFalse(vfs.FileExists("C:\\foo.txt"));
            });

            it("should support deleting folders as well as files", () => {

                const vfs = make_vfs();

                vfs.AddFolder("C:\\Foo\\Bar");
                assert.isTrue(vfs.FolderExists("C:\\Foo\\Bar"));
                vfs.Delete("C:\\Foo\\Bar");
                assert.isFalse(vfs.FolderExists("C:\\Foo\\Bar"));
            });

            it("should ignore case when deleting a file", () => {

                const vfs = make_vfs();

                vfs.AddFile("C:\\FOO.TXT", "FOOBAR");
                assert.isTrue(vfs.FileExists("C:\\FOO.TXT"));

                vfs.Delete("c:\\foo.txt");
                assert.isFalse(vfs.FileExists("C:\\FOO.TxT"));
            });

            it("should recursively delete all files and folders if path is a folder", () => {

                const vfs = make_vfs();

                vfs.AddFile("C:\\RootOne\\SubFolder1\\a.txt");
                vfs.AddFile("C:\\RootOne\\SubFolder2\\b.txt");

                assert.isTrue(vfs.FolderExists("C:\\RootOne\\SubFolder1"));
                assert.isTrue(vfs.FolderExists("C:\\RootOne\\SubFolder2"));
                assert.isTrue(vfs.FileExists("C:\\RootOne\\SubFolder1\\a.txt"));
                assert.isTrue(vfs.FileExists("C:\\RootOne\\SubFolder1\\a.txt"));

                assert.doesNotThrow(() => vfs.Delete("C:\\RootOne"));

                assert.isFalse(vfs.FolderExists("C:\\RootOne\\SubFolder1"));
                assert.isFalse(vfs.FolderExists("C:\\RootOne\\SubFolder2"));
                assert.isFalse(vfs.FileExists("C:\\RootOne\\SubFolder1\\a.txt"));
                assert.isFalse(vfs.FileExists("C:\\RootOne\\SubFolder1\\a.txt"));
            });
        });

        describe("#DeleteMatching", () => {

            it("should delete matching top-level folders only", () => {

                const vfs = make_vfs();

                vfs.AddFolder("C:\\RootOne\\SubDir1");
                vfs.AddFolder("C:\\RootOne\\SubDir2");
                vfs.AddFolder("C:\\RootOne\\SubDir3");
                vfs.AddFolder("C:\\RootOne\\foo\\SubDir1");
                vfs.AddFolder("C:\\RootOne\\bar\\SubDir1");
                vfs.AddFile("C:\\RootOne\\subdir1.txt");

                assert.doesNotThrow(
                    () => vfs.DeleteInFolderMatching("C:\\RootOne", "SubDir*", { files: false })
                );

                assert.isFalse(vfs.FolderExists("C:\\RootOne\\SubDir1"));
                assert.isFalse(vfs.FolderExists("C:\\RootOne\\SubDir2"));
                assert.isFalse(vfs.FolderExists("C:\\RootOne\\SubDir3"));

                assert.isTrue(vfs.FolderExists("C:\\RootOne\\foo"));
                assert.isTrue(vfs.FolderExists("C:\\RootOne\\foo\\SubDir1"));

                assert.isTrue(vfs.FolderExists("C:\\RootOne\\bar"));
                assert.isTrue(vfs.FolderExists("C:\\RootOne\\bar\\SubDir1"));

                assert.isTrue(vfs.FileExists("C:\\RootOne\\subdir1.txt"));
            });

            it("should delete matching top-level files only", () => {

                const vfs = make_vfs();

                vfs.AddFile("C:\\RootOne\\foo_a.txt");
                vfs.AddFile("C:\\RootOne\\foo_b.txt");
                vfs.AddFile("C:\\RootOne\\foo_c.txt");
                vfs.AddFile("C:\\RootOne\\bar.txt");
                vfs.AddFile("C:\\RootOne\\baz.txt");

                vfs.AddFolder("C:\\RootOne\\foo\\bar");

                vfs.DeleteInFolderMatching("C:\\RootOne", "foo*", { files: true, folders: false });

                assert.deepEqual(vfs.FindAllFiles("C:\\RootOne"), ["bar.txt", "baz.txt"]);
                assert.deepEqual(vfs.FindAllFolders("C:\\RootOne"), ["foo"]);
            });
        });

        describe("#RenameFile", () => {

            it("should allow the moving of a file when the dest file does not exist", () => {

                const vfs = make_vfs();

                vfs.AddFile("C:\\foo.txt");
                assert.isFalse(vfs.FileExists("C:\\bar.txt"));

                vfs.Rename("C:\\foo.txt", "C:\\bar.txt");
                assert.isTrue(vfs.FileExists("C:\\bar.txt"));
            });

            it("should throw if the source file cannot be found", () => {
                const vfs = make_vfs();
                assert.throws(() => vfs.Rename("C:\\foo.txt", "C:\\bar.txt"),
                                               "ENOENT: no such file or directory");
            });
        });

        describe("#CopyFolder", () => {

            it("should copy a folder and all the contents to a new location", () => {

                const vfs = make_vfs();

                vfs.AddFolder("C:\\foo\\bar\\baz");
                vfs.AddFile("C:\\foo\\bar\\baz\\blah.txt", "Hello, World!");

                assert.isFalse(vfs.FolderExists("C:\\dest"));
                assert.isFalse(vfs.FileExists("C:\\dest\\foo\\bar\\baz\\blah.txt"));

                // The folder path does not end with a '\', meaning we
                // want foo copied in to dest.
                vfs.CopyFolder("C:\\foo", "C:\\dest");
                assert.isTrue(vfs.FileExists("C:\\dest\\foo\\bar\\baz\\blah.txt"));
            });

            it("should copy the folder contents if specified by a trailing path separator", () => {

                const vfs = make_vfs();

                vfs.AddFolder("C:\\foo\\bar\\baz");
                vfs.AddFile("C:\\foo\\bar\\baz\\blah.txt", "Hello, World!");

                assert.isFalse(vfs.FolderExists("C:\\dest"));
                assert.isFalse(vfs.FileExists("C:\\dest\\foo\\bar\\baz\\blah.txt"));

                // The folder path does not end with a '\', meaning we
                // want foo copied in to dest.
                vfs.CopyFolder("C:\\foo\\", "C:\\dest");

                assert.isTrue(vfs.FileExists("C:\\dest\\bar\\baz\\blah.txt"));
            });

        });
    });

    describe("Finding Files (wildcards)", () => {

        it("should match files using literal expressions", () => {

            const vfs = make_vfs();

            ["foo.txt", "bar.txt", "fox.txt", "fun.txt"].forEach(f => {
                vfs.AddFile(`C:\\Users\\Construct\\${f}`);
            });

            assert.deepEqual(
                vfs.FindFiles("C:\\Users\\Construct", "foo.txt"),
                ["foo.txt"]
            );
        });

        it("should resolve SFN matches with the correct LFN", () => {

            const vfs = make_vfs();

            vfs.AddFile("C:\\Users\\Construct\\HelloWorld.txt", "Hello, World!");
            vfs.AddFile("C:\\Users\\Construct\\DoNotMatch.txt", "No match 4 u");

            assert.deepEqual(
                vfs.FindFiles("C:\\Users\\Construct", "HELLOW~1.TXT"),
                ["helloworld.txt"]
            );
        });

        it("should find all files with the same extension", () => {

            const vfs = make_vfs();

            vfs.AddFile("C:\\RootOne\\foo.txt");
            vfs.AddFile("C:\\RootOne\\bar.txt");
            vfs.AddFile("C:\\RootOne\\baz.zip");

            assert.deepEqual(
                vfs.FindFiles("C:\\RootOne", "*.txt"),
                ["bar.txt", "foo.txt"]
            );
        });
    });

    describe("FolderContentsSize", () => {

        it("should calculate the size of the folder", () => {

            const vfs = make_vfs();

            vfs.AddFile("C:\\RootOne\\SubFolder1\\foo.txt", "abcd");
            vfs.AddFile("C:\\RootOne\\SubFolder2\\bar.txt", "efgh");

            assert.equal(vfs.FolderContentsSize("C:\\RootOne"), 8);
        });

        it("should throw if the path cannot be found", () => {

            const vfs = make_vfs();
            assert.throws(() => vfs.FolderContentsSize("C:\\RootOne"), "Path not found");
        });
    });

    describe("#MoveFile", () => {

        it("should move a file from one abs path to another.", () => {

            const vfs = make_vfs();
            vfs.AddFile("C:\\foo.txt");

            assert.isTrue(vfs.FileExists("C:\\foo.txt"));
            assert.isFalse(vfs.FileExists("C:\\bar.txt"));

            assert.doesNotThrow(() => vfs.MoveFile("C:\\foo.txt", "C:\\bar.txt"));

            assert.isTrue(vfs.FileExists("C:\\bar.txt"));
            assert.isFalse(vfs.FileExists("C:\\foo.txt"));
        });

        it("should move a file from 'src' in to a folder in 'dst'", () => {

            const vfs = make_vfs();
            vfs.AddFile("C:\\foo.txt");
            vfs.AddFolder("C:\\destination");

            assert.isFalse(vfs.FileExists("C:\\destination\\foo.txt"));
            assert.doesNotThrow(() => vfs.MoveFile("C:\\foo.txt", "C:\\destination"));

            assert.isTrue(vfs.FileExists("C:\\destination\\foo.txt"));
            assert.isFalse(vfs.FileExists("C:\\foo.txt"));
        });

        it("should throw if attempting to move a file which cannot be found", () => {
            const vfs = make_vfs();
            vfs.AddFile("C:\\foo.txt");
            assert.throws(() => vfs.MoveFile("C:\\bar.txt", "C:\\foo.txt"), "cannot find src");
        });

        it("should move a file using its LFN when the move input uses a SFN", () => {

            const vfs = make_vfs();
            vfs.AddFile("C:\\HelloWorld.txt");
            vfs.AddFolder("C:\\dest");

            assert.isFalse(vfs.FileExists("C:\\dest\\HelloWorld.txt"));
            vfs.MoveFile("C:\\HELLOW~1.TXT", "C:\\dest");

            assert.isTrue(vfs.FileExists("C:\\dest\\HelloWorld.txt"));
        });

        it("should throw if src/dest are relative paths", () => {

            const vfs = make_vfs();
            vfs.AddFile("C:\\foo");

            assert.throws(() => vfs.MoveFile("C:foo.txt", "C:\\bar.txt"), "not support relative paths");
            assert.throws(() => vfs.MoveFile("C:\\foo.txt", "C:bar.txt"), "not support relative paths");
        });

        it("should throw if src/dest contain wildcard characters", () => {

            const vfs = make_vfs();
            vfs.AddFile("C:\\foo.txt");

            assert.throws(() => vfs.MoveFile("C:\\*.txt", "C:\\bar.txt"), "not support wildcards");
            assert.throws(() => vfs.MoveFile("C:\\foo.txt", "C:\\*.txt"), "not support wildcards");
        });

        it("should throw if the source file is a folder", () => {

            const vfs = make_vfs();
            vfs.AddFolder("C:\\foo");

            assert.throws(() => vfs.MoveFile("C:\\foo", "C:\\bar"), "cannot move folders");
        });

        it("should throw if overwrite=false and dest file exists", () => {

            const vfs = make_vfs();
            vfs.AddFile("C:\\src.txt");
            vfs.AddFile("C:\\dst.txt");

            assert.throws(
                () => vfs.MoveFile("C:\\src.txt", "C:\\dst.txt", false),
                "MoveFile cannot overwrite destination file."
            );
        });
    });

    describe("#MoveFolder", () => {

        it("should move folder (and all files) from src->dst (creating dst)", () => {

            const vfs = make_vfs();
            vfs.AddFile("C:\\src\\foo.txt");
            vfs.AddFile("C:\\src\\bar.txt");
            vfs.AddFile("C:\\src\\subdir1\\baz.txt");

            assert.isFalse(vfs.FolderExists("C:\\dst"));

            assert.doesNotThrow(() => vfs.MoveFolder("C:\\src", "C:\\dst"));

            assert.isTrue(vfs.FolderExists("C:\\dst"));
            assert.isTrue(vfs.FileExists("C:\\dst\\foo.txt"));
            assert.isTrue(vfs.FileExists("C:\\dst\\bar.txt"));
            assert.isTrue(vfs.FileExists("C:\\dst\\subdir1\\baz.txt"));
            assert.isFalse(vfs.FolderExists("C:\\src"));
        });

        it("should move folder 'src' in to 'dst' when 'dst' ends with pathsep", () => {

            const vfs = make_vfs();
            vfs.AddFile("C:\\src\\foo.txt");
            vfs.AddFile("C:\\src\\bar.txt");
            vfs.AddFolder("C:\\dst");

            assert.doesNotThrow(() => vfs.MoveFolder("C:\\src", "C:\\dst\\"));

            assert.isTrue(vfs.FileExists("C:\\dst\\src\\foo.txt"));
            assert.isTrue(vfs.FileExists("C:\\dst\\src\\bar.txt"));

            assert.isFalse(vfs.FileExists("C:\\src"));
        });

        it("should throw if 'src' ends with a pathsep", () => {

            const vfs = make_vfs();
            vfs.AddFolder("C:\\src");
            vfs.AddFolder("C:\\dst");

            assert.throws(
                () => vfs.MoveFolder("C:\\src\\", "C:\\dst"),
                "Source folder must not end with a path separator."
            );

            assert.throws(
                () => vfs.MoveFolder("C:\\src/", "C:\\dst"),
                "Source folder must not end with a path separator."
            );
        });

        it("should throw if the destination doesn't exist", () => {

            const vfs = make_vfs();
            vfs.AddFolder("C:\\src\\foo.txt");

            assert.throws(
                () => vfs.MoveFolder("C:\\src", "C:\\missing\\folder\\path"),
                "Path to destination does not exist."
            );
        });

        it("should merge folders if paths already exist between 'src' and 'dst'", () => {

            const vfs = make_vfs();
            vfs.AddFolder("C:\\foo\\subdir1\\foo.txt");
            vfs.AddFolder("C:\\foo\\subdir1\\subdir2\\subdir3\\bar.txt");

            vfs.AddFile("C:\\dst\\foo\\subdir1\\subdir2\\subdir3\\hello.txt");
            vfs.AddFile("C:\\dst\\foo\\subdir1\\existing.txt");

            assert.doesNotThrow(() => vfs.MoveFolder("C:\\foo", "C:\\dst"));

            assert.isTrue(vfs.Exists("C:\\dst\\foo\\subdir1\\foo.txt"));
            assert.isTrue(vfs.Exists("C:\\dst\\foo\\subdir1\\subdir2\\subdir3\\bar.txt"));
            assert.isTrue(vfs.Exists("C:\\dst\\foo\\subdir1\\existing.txt"));

            assert.isFalse(vfs.Exists("C:\\foo"));
        });
    });
});
