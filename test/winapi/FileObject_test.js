const assert            = require("chai").assert;
const File              = require("../../src/winapi/FileObject.js");
const VirtualFileSystem = require("../../src/runtime/virtfs");
const make_ctx          = require("../testlib");

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

    describe(".Attributes", () => {

        it("should return a number when .Attributes is requested", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\foo.txt");

            const file = new File(ctx, "C:\\foo.txt");
            assert.isNumber(file.attributes);
            assert.equal(file.attributes, 32);
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

        it("should use the shortname only where specified in the path", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\SubDirectory\\HelloWorld.txt", "AAAA");

            const file = new File(ctx, "C:\\SubDirectory\\HELLOW~1.TXT");

            assert.equal(file.Name, "HELLOW~1.TXT");
            assert.equal(file.Path, "C:\\SubDirectory\\HELLOW~1.TXT");
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

        it("should throw if trying to overwrite itself", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_permission_denied: () => {
                        throw new Error("permission denied");
                    }
                }
            });
            ctx.vfs.AddFile("C:\\foo.txt");
            assert.isTrue(ctx.vfs.FileExists("C:\\foo.txt"));

            const file = new File(ctx, "C:\\foo.txt");
            assert.throws(() => file.Copy("C:\\foo.txt"), "permission denied");
        });

        it("should throw if the destination filename contains a wildcard char", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("no wildcards");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\foo.txt");
            const file = new File(ctx, "C:\\foo.txt");
            assert.throws(() => file.copy("*.txt"), "no wildcards");
        });

        it("should throw if the inputs are invalid", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("invalid arg");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\foo.txt");

            const file   = new File(ctx, "C:\\foo.txt"),
                  params = [
                      ""
                  ];

            params.forEach(p => assert.throws(() => file.Copy(p), "invalid arg"));
        });

        it("should copy to the CWD if no path is given", () => {

            const ctx  = make_ctx(),
                  srcpath = `${ctx.get_env("path")}\\foo.txt`,
                  dstpath = `${ctx.get_env("path")}\\bar.txt`;

            ctx.vfs.AddFile(srcpath, "hello");

            const file = new File(ctx, srcpath);;

            assert.isTrue(ctx.vfs.FileExists(srcpath));
            assert.isFalse(ctx.vfs.FileExists(dstpath));

            assert.doesNotThrow(() => file.Copy("bar.txt"));

            assert.isTrue(ctx.vfs.FileExists(dstpath));
        });

        it("should copy to the CWD if only 'C:<filename>' is given", () => {

            const ctx  = make_ctx(),
                  srcpath = `${ctx.get_env("path")}\\foo.txt`,
                  dstpath = `${ctx.get_env("path")}\\bar.txt`;

            ctx.vfs.AddFile(srcpath, "hello");

            const file = new File(ctx, srcpath);;

            assert.isTrue(ctx.vfs.FileExists(srcpath));
            assert.isFalse(ctx.vfs.FileExists(dstpath));

            assert.doesNotThrow(() => file.Copy("C:bar.txt"));

            assert.isTrue(ctx.vfs.FileExists(dstpath));
        });

        it("should correctly overwrite the dest file by default", () => {

            const ctx = make_ctx(),
                  src = "C:\\RootOne\\foo.txt",
                  dst = "C:\\RootOne\\bar.txt";

            ctx.vfs.AddFile(src, "hello");
            ctx.vfs.AddFile(dst, "world");

            const file = new File(ctx, src);

            assert.deepEqual(ctx.vfs.ReadFileContents(src).toString(), "hello");
            assert.deepEqual(ctx.vfs.ReadFileContents(dst).toString(), "world");

            file.copy("C:\\RootOne\\bar.txt");

            assert.deepEqual(ctx.vfs.ReadFileContents(src).toString(), "hello");
            assert.deepEqual(ctx.vfs.ReadFileContents(dst).toString(), "hello");
        });


        it("should not overwrite the file is overwrite=false and file exists", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_file_already_exists: () => {
                        throw new Error("file exists");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\RootOne\\foo.txt");
            ctx.vfs.AddFile("C:\\RootOne\\bar.txt");

            const file = new File(ctx, "C:\\RootOne\\foo.txt");

            assert.isTrue(ctx.vfs.FileExists("C:\\RootOne\\bar.txt"));
            assert.throws(() => file.Copy("C:\\RootOne\\bar.txt", false), "file exists");
        });

        it("should copy to one folder up if '../filename' is used", () => {

            const ctx = make_ctx(),
                  src = `C:\\Users\\Construct\\foo.txt`,
                  dst = `C:\\Users\\bar.txt`;

            ctx.vfs.AddFile(src);

            const file = new File(ctx, src);

            assert.isFalse(ctx.vfs.FileExists(dst));
            assert.doesNotThrow(() => file.Copy("..\\bar.txt"));

            assert.isTrue(ctx.vfs.FileExists(dst));
        });

        it("should copy the filename if the path is '../'", () => {

            const ctx = make_ctx(),
                  src = "C:\\Users\\Construct\\foo.txt",
                  dst = "C:\\Users\\foo.txt";

            ctx.vfs.AddFile(src);

            const file = new File(ctx, src);

            assert.isFalse(ctx.vfs.FileExists(dst));
            assert.doesNotThrow(() => file.Copy("../"));
            assert.isTrue(ctx.vfs.FileExists(dst));
        });

        it("should throw if destination contains a folder name matching dest filename", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_permission_denied: () => {
                        throw new Error("filename not uniq");
                    }
                }
            });

            ctx.vfs.AddFolder("C:\\RootOne\\bar");
            ctx.vfs.AddFile("C:\\RootOne\\foo.txt");

            const file = new File(ctx, "C:\\RootOne\\foo.txt");

            assert.throws(() => file.Copy("C:\\RootOne\\bar"), "filename not uniq");
        });

        it("should copy shortpaths", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFile("C:\\FooBarBaz\\helloworld.txt");

            const file = new File(ctx, "C:\\FooBarBaz\\helloworld.txt");

            assert.isFalse(ctx.vfs.FileExists("C:\\FooBarBaz\\bar.txt"));
            file.Copy("C:\\FOOBAR~1\\bar.txt");
            assert.isTrue(ctx.vfs.FileExists("C:\\FooBarBaz\\bar.txt"));
        });
    });

    describe("#Delete", () => {

        it("should delete the file", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\foo.txt");
            assert.isTrue(ctx.vfs.FileExists("C:\\foo.txt"));

            const file = new File(ctx, "C:\\foo.txt");

            assert.doesNotThrow(() => file.Delete());
            assert.isFalse(ctx.vfs.FileExists("C:\\foo.txt"));

            assert.throws(() => file.name, "throw_file_not_found");
            assert.throws(() => file.path, "throw_file_not_found");
            assert.throws(() => file.type, "throw_file_not_found");
        });
    });

    describe("#Move", () => {

        it("should successfully move a file", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\foo.txt");

            const file = new File(ctx, "C:\\foo.txt");
            assert.isFalse(ctx.vfs.FileExists("C:\\bar.txt"));

            assert.doesNotThrow(() => file.Move("C:\\bar.txt"));

            assert.isFalse(ctx.vfs.FileExists("C:\\foo.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\bar.txt"));

            assert.equal(file.Name, "bar.txt");
        });

        it("should not throw when moving a file", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\foo.txt");

            const file = new File(ctx, "C:\\foo.txt");

            assert.doesNotThrow(() => file.Move("C:\\foo.txt"));
            assert.isTrue(ctx.vfs.FileExists("C:\\foo.txt"));
        });

        it("should bit throw if being moved to itself", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFile("C:\\foo.txt");
            assert.isTrue(ctx.vfs.FileExists("C:\\foo.txt"));

            const file = new File(ctx, "C:\\foo.txt");
            assert.doesNotThrow(() => file.Move("C:\\foo.txt"));
        });

        it("should throw if the destination filename contains a wildcard char", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("no wildcards");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\foo.txt");
            const file = new File(ctx, "C:\\foo.txt");
            assert.throws(() => file.move("*.txt"), "no wildcards");
        });

        it("should throw if the inputs are invalid", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("invalid arg");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\foo.txt");

            const file   = new File(ctx, "C:\\foo.txt"),
                  params = [
                      ""
                  ];

            params.forEach(p => assert.throws(() => file.Move(p), "invalid arg"));
        });

        it("should move to the CWD if no path is given", () => {

            const ctx  = make_ctx(),
                  srcpath = `${ctx.get_env("path")}\\foo.txt`,
                  dstpath = `${ctx.get_env("path")}\\bar.txt`;

            ctx.vfs.AddFile(srcpath, "hello");

            const file = new File(ctx, srcpath);;

            assert.isTrue(ctx.vfs.FileExists(srcpath));
            assert.isFalse(ctx.vfs.FileExists(dstpath));

            assert.doesNotThrow(() => file.Move("bar.txt"));

            assert.isTrue(ctx.vfs.FileExists(dstpath));
            assert.isFalse(ctx.vfs.FileExists(srcpath));
        });

        it("should move to the CWD if only 'C:<filename>' is given", () => {

            const ctx  = make_ctx(),
                  srcpath = `${ctx.get_env("path")}\\foo.txt`,
                  dstpath = `${ctx.get_env("path")}\\bar.txt`;

            ctx.vfs.AddFile(srcpath, "hello");

            const file = new File(ctx, srcpath);;

            assert.isTrue(ctx.vfs.FileExists(srcpath));
            assert.isFalse(ctx.vfs.FileExists(dstpath));

            assert.doesNotThrow(() => file.Move("C:bar.txt"));

            assert.isTrue(ctx.vfs.FileExists(dstpath));
            assert.isFalse(ctx.vfs.FileExists(srcpath));
        });

        it("should throw when overwriting an existing file by default", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_file_already_exists: () => {
                        throw new Error("exists");
                    }
                }
            });

            let src = "C:\\RootOne\\foo.txt",
                dst = "C:\\RootOne\\bar.txt";

            ctx.vfs.AddFile(src, "hello");
            ctx.vfs.AddFile(dst, "world");

            const file = new File(ctx, src);

            assert.deepEqual(ctx.vfs.ReadFileContents(src).toString(), "hello");
            assert.deepEqual(ctx.vfs.ReadFileContents(dst).toString(), "world");

            assert.throws(() => file.move("C:\\RootOne\\bar.txt"), "exists");

            assert.deepEqual(ctx.vfs.ReadFileContents(src).toString(), "hello");
            assert.deepEqual(ctx.vfs.ReadFileContents(dst).toString(), "world");
        });

        it("should move to one folder up if '../filename' is used", () => {

            const ctx = make_ctx(),
                  src = `C:\\Users\\Construct\\foo.txt`,
                  dst = `C:\\Users\\bar.txt`;

            ctx.vfs.AddFile(src);

            const file = new File(ctx, src);

            assert.isFalse(ctx.vfs.FileExists(dst));
            assert.doesNotThrow(() => file.Move("..\\bar.txt"));

            assert.isTrue(ctx.vfs.FileExists(dst));
            assert.isFalse(ctx.vfs.FileExists(src));
        });

        it("should move the filename if the path is '../'", () => {

            const ctx = make_ctx(),
                  src = "C:\\Users\\Construct\\foo.txt",
                  dst = "C:\\Users\\foo.txt";

            ctx.vfs.AddFile(src);

            const file = new File(ctx, src);

            assert.isFalse(ctx.vfs.FileExists(dst));
            assert.doesNotThrow(() => file.Move("../"));
            assert.isTrue(ctx.vfs.FileExists(dst));
            assert.isFalse(ctx.vfs.FileExists(src));
        });

        it("should throw if destination contains a folder name matching dest filename", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_permission_denied: () => {
                        throw new Error("filename not uniq");
                    }
                }
            });

            ctx.vfs.AddFolder("C:\\RootOne\\bar");
            ctx.vfs.AddFile("C:\\RootOne\\foo.txt");

            const file = new File(ctx, "C:\\RootOne\\foo.txt");

            assert.throws(() => file.Move("C:\\RootOne\\bar"), "filename not uniq");
        });

        it("should move shortpaths", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFile("C:\\FooBarBaz\\helloworld.txt");

            const file = new File(ctx, "C:\\FooBarBaz\\helloworld.txt");

            assert.isFalse(ctx.vfs.FileExists("C:\\FooBarBaz\\bar.txt"));
            file.Move("C:\\FOOBAR~1\\bar.txt");
            assert.isTrue(ctx.vfs.FileExists("C:\\FooBarBaz\\bar.txt"));
        });
    });

    describe("#OpenAsTextStream", () => {

        it("should allow text to be written to the file", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\foo.txt", "testing");

            const FOR_WRITING   = 2,
                  OPEN_AS_ASCII = 0;

            const file = new File(ctx, "C:\\foo.txt"),
                  ts   = file.OpenAsTextStream(FOR_WRITING, OPEN_AS_ASCII);

            assert.equal(ctx.vfs.ReadFileContents("C:\\foo.txt").toString(), "testing");
            ts.Write("Hello, World!");
            assert.equal(ctx.vfs.ReadFileContents("C:\\foo.txt").toString(), "Hello, World!");
        });

        it("should throw 'bad file mode' if opened with no args and a write is attemped", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_bad_file_mode: () => {
                        throw new Error("bad file mode");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\foo.txt", "testing");

            const file = new File(ctx, "C:\\foo.txt"),
                  ts   = file.OpenAsTextStream();

            assert.throws(() => ts.Write("hello"), "bad file mode");
        });

        it("should auto-write to the file after each call to #Write", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\foo.txt", "alpha");

            let iomode = 2, // write
                format = 0; // ascii

            const file = new File(ctx, "C:\\foo.txt"),
                  ts   = file.OpenAsTextStream(iomode, format);

            assert.equal(ctx.vfs.ReadFileContents("C:\\foo.txt"), "alpha");

            ts.Write("bravo");
            assert.equal(ctx.vfs.ReadFileContents("C:\\foo.txt"), "bravo");

            ts.Write("charlie");
            assert.equal(ctx.vfs.ReadFileContents("C:\\foo.txt"), "bravocharlie");

            ts.Write("delta");
            assert.equal(ctx.vfs.ReadFileContents("C:\\foo.txt"), "bravocharliedelta");
        });

        it("should open and correctly append when opened in append-only mode", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\foo.txt", "existing content");

            const file = new File(ctx, "C:\\foo.txt"),
                  ts   = file.OpenAsTextStream(8, //for appending
                                               0); // use ASCII

            assert.equal(ctx.vfs.ReadFileContents("C:\\foo.txt"), "existing content");

            ts.Write("hello");
            ts.Write("world");

            assert.equal(
                ctx.vfs.ReadFileContents("C:\\foo.txt"),
                "existing contenthelloworld"
            );
        });

        it("should not add a BOM to an ASCII file if opened in append+unicode", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\file.txt", "AAAA");

            assert.equal(ctx.vfs.ReadFileContents("C:\\file.txt"), "AAAA");

            const file = new File(ctx, "C:\\file.txt"),
                  ts   = file.OpenAsTextStream(8, // for appending
                                               -1); // use unicode

            const A   = 0x41,
                  B   = 0x42,
                  NUL = 0x00;

            ts.Write("BBBB");

            assert.deepEqual(
                ctx.vfs.ReadFileContents("C:\\file.txt"),
                Buffer.from([
                    A, A, A, A,
                    B, NUL,
                    B, NUL,
                    B, NUL,
                    B, NUL
                ])
            );
        });

        it("should open and only allow reading in read-only mode", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_bad_file_mode: () => {
                        throw new Error("read only mode");
                    }
                }
            });
            ctx.vfs.AddFile("C:\\file.txt", "AAAA");

            const file = new File(ctx, "C:\\file.txt"),
                  ts   = file.OpenAsTextStream(1, // for reading
                                               0);// use ASCII

            assert.equal(ts.ReadAll(), "AAAA");
            assert.throws(() => ts.Write("BBBB"), "read only ");
        });

        it("should open and only allow writing in write-only mode", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_bad_file_mode: () => {
                        throw new Error("write only mode");
                    }
                }
            });
            ctx.vfs.AddFile("C:\\file.txt", "AAAA");

            const file = new File(ctx, "C:\\file.txt"),
                  ts   = file.OpenAsTextStream(2, //for writing
                                               0); // use ASCII

            assert.doesNotThrow(() => ts.Write("BBBB"));
            assert.throws(() => ts.ReadAll(), "write only mode");
        });

        it("should write ASCII chars when the format=0", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\file.txt", "AAAA");

            const file = new File(ctx, "C:\\file.txt"),
                  ts   = file.OpenAsTextStream(2, // for writing
                                               0);// use ASCII

            ts.Write("BBBB");

            assert.deepEqual(
                ctx.vfs.ReadFileContents("C:\\file.txt"),
                Buffer.from("BBBB")
            );
        });

        it("should use Unicode as the format if format=-1", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\file.txt");

            const file = new File(ctx, "C:\\file.txt"),
                  ts   = file.OpenAsTextStream(2,    // for writing
                                               -1 ); // use ASCII

            ts.Write("BBBB");

            assert.deepEqual(
                ctx.vfs.ReadFileContents("C:\\file.txt"),
                Buffer.from([
                    0xFF, 0xFE, // BOM
                    0x42, 0x00,
                    0x42, 0x00,
                    0x42, 0x00,
                    0x42, 0x00
                ])
            );
        });

        it("should use the ASCII as the default if format =-2", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\file.txt");

            const file = new File(ctx, "C:\\file.txt"),
                  ts   = file.OpenAsTextStream(2,  // for writing
                                               -2); // use default

            ts.Write("BBBB");

            assert.deepEqual(
                ctx.vfs.ReadFileContents("C:\\file.txt"),
                Buffer.from([0x42, 0x42, 0x42, 0x42])
            );
        });

        it("should use the system default if no FORMAT param is set", () => {

            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\file.txt");

            const file = new File(ctx, "C:\\file.txt"),
                  ts   = file.OpenAsTextStream(2); // for writing

            ts.Write("BBBB");

            assert.deepEqual(
                ctx.vfs.ReadFileContents("C:\\file.txt"),
                Buffer.from([0x42, 0x42, 0x42, 0x42])
            );
        });

        it("should open in read-only mode when no args are given", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_bad_file_mode: () => {
                        throw new Error("bad file mode");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\file.txt", "AAAA");

            const file = new File(ctx, "C:\\file.txt"),
                  ts   = file.OpenAsTextStream();

            assert.equal(ts.ReadAll(), "AAAA");
            assert.throws(() => ts.Write("BBBB"), "bad file mode");
        });

        it("should throw if the inputs for either 'iomode' or 'format' are invalid", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("invalid input");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\file.txt");
            const file       = new File(ctx, "C:\\file.txt"),
                  bad_inputs = [
                      { format: 3, iomode: 0 },
                      { format: 4, iomode: 0 },
                      { format: 5, iomode: 0 },
                      { format: 6, iomode: 0 },
                      { format: 2, iomode: 1 },
                      { format: 2, iomode: 2 }
                  ];

            bad_inputs.forEach((t) => {
                assert.throws(() => file.OpenAsTextStream(t.format, t.iomode), "invalid input");
            });
        });
    });
});
