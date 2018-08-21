const assert = require("chai").assert,
      TextStream = require("../../src/winapi/TextStream"),
      VirtualFileSystem = require("../../src/runtime/virtfs"),
      make_context = require("../testlib");


// The TextStream most commonly represents a text file, however it can
// also represent any input/output stream, such as stdin or stdout.

const new_vfs = () => new VirtualFileSystem({ register: () => {} });
var context;

const CAN_READ     = true,
      CANNOT_READ  = false,
      CAN_WRITE    = 1,
      CAN_APPEND   = 2,
      CANNOT_WRITE = 0;

describe("TextStream", () => {

    // A TextStream can represent either a:
    //
    //   - text file
    //   - input/output stream (such as StdIn, StdOut, and StdErr).
    //

    beforeEach(() => {
        context = make_context();
    });

    describe("Properties", () => {

        describe(".AtEndOfLine", () => {

            it("should return false for a newly opened, populated file", (done) => {

                context.vfs.AddFile("C:\\foo.txt", "aaaabbbbccccdddd");
                let ts = new TextStream(context, "C:\\foo.txt");

                assert.equal(ts.AtEndOfLine, 0);

                done();
            });

            it("should return true when pos is immediately before CRLF", (done) => {

                context.vfs.AddFile("C:\\foo.txt", "aaaa\r\nbbbb\r\ncccc\r\ndddd\r\n");
                let ts = new TextStream(context, "C:\\foo.txt");

                assert.isFalse(ts.AtEndOfLine);
                assert.equal(ts.Read(4), "aaaa");
                assert.isTrue(ts.AtEndOfLine);

                done();
            });

            it("should throw a TypeError if .AtEndOfLine is set", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("cannot set .AtEndOfLine");
                        }
                    }});

                context.vfs.AddFile("C:\\foo.txt", "aaaa\r\nbbbb\r\ncccc\r\ndddd\r\n");
                let ts = new TextStream(ctx, "C:\\foo.txt");

                assert.throws(() => ts.AtEndOfLine = "hello", "cannot set .AtEndOfLine");

                done();
            });
        });

        describe(".AtEndOfStream", () => {

            it("should return true if the read position is at the EOS", (done) => {

                context.vfs.AddFile("C:\\foo.txt", "aaaa");
                let ts = new TextStream(context, "C:\\foo.txt");

                assert.isFalse(ts.AtEndOfStream);
                assert.equal(ts.Read(4), "aaaa");
                assert.isTrue(ts.AtEndOfStream);

                done();
            });

            it("should throw a TypeError if .AtEndOfStream is set", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("cannot set .AtEndOfStream");
                        }
                    }});

                context.vfs.AddFile("C:\\foo.txt", "aaaa\r\nbbbb\r\ncccc\r\ndddd\r\n");
                let ts = new TextStream(ctx, "C:\\foo.txt");

                assert.throws(() => ts.AtEndOfStream = "hello", "cannot set .AtEndOfStream");

                done();
            });

        });

        describe(".Column", () => {

            it("should report the column as '1' if the backing file is empty", (done) => {

                context.vfs.AddFile("C:\\empty.txt");
                let ts = new TextStream(context, "C:\\empty.txt");

                assert.equal(ts.Column, 1);
                done();
            });

            it("should correctly report the column for multi-line files", (done) => {

                context.vfs.AddFile("C:\\multiline.txt", "abc\r\ndef");
                let ts = new TextStream(context, "C:\\multiline.txt");

                assert.equal(ts.Column, 1);

                let expected = [
                    { col: 1, chr: "a"  },
                    { col: 2, chr: "b"  },
                    { col: 3, chr: "c"  },
                    { col: 4, chr: "\r" },
                    { col: 5, chr: "\n" },
                    { col: 1, chr: "d"  }
                ];

                expected.forEach((exp) => {
                    assert.equal(ts.Column,  exp.col);
                    assert.equal(ts.Read(1), exp.chr);
                });

                done();
            });

            it("should throw if .Column is assigned-to", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("cannot set .Column");
                        }
                    }});

                context.vfs.AddFile("C:\\foo.txt", "abc");
                let ts = new TextStream(ctx, "C:\\foo.txt");

                assert.throws(() => ts.Column = 1, "cannot set .Column");
                done();
            });
        });

        describe(".Line", () => {

            it("should return 1 if the stream is empty", (done) => {

                context.vfs.AddFile("C:\\empty.txt");
                let ts = new TextStream(context, "C:\\empty.txt");

                assert.equal(ts.Line, 1);

                done();
            });

            it("should return the correct line number", (done) => {

                context.vfs.AddFile("C:\\foo.txt", "aaaa\r\nbbbb\r\n");
                let ts = new TextStream(context, "C:\\foo.txt");

                let expected = [
                    1, 1, 1, 1, 1, 1,
                    2, 2, 2, 2, 2, 2
                ];

                expected.forEach((exp) => {
                    assert.equal(ts.line, exp);
                    ts.Read(1);
                });

                done();
            });

            it("should throw if .Line is assigned to", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("cannot set .Line");
                        }
                    }});

                context.vfs.AddFile("C:\\foo.txt", "abc");
                let ts = new TextStream(ctx, "C:\\foo.txt");

                assert.throws(() => ts.Line = 1, "cannot set .Line");

                done();
            });
        });
    });

    describe("Methods", () => {

        describe("#Close", () => {

            it("should allow #Close to be called multiple times without throwing", (done) => {

                context.vfs.AddFile("C:\\foo.txt", "aaaa");
                let ts = new TextStream(context, "C:\\foo.txt");

                assert.doesNotThrow(() => ts.close());
                assert.doesNotThrow(() => ts.close());
                assert.doesNotThrow(() => ts.close());

                done();
            });

            it("should throw if any params are passed to #Close()", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("cannot pass params to close");
                        }
                    }});

                let ts = new TextStream(ctx, "C:\\foo.txt");
                assert.throws(() => ts.Close(true), "cannot pass params to close");

                done();
            });
        });

        describe("#Read", () => {

            it("should return the scalar-num chars requested to be read", (done) => {

                context.vfs.AddFile("C:\\foo.txt", "aaaabbbbccccdddd");
                let ts = new TextStream(context, "C:\\foo.txt");

                assert.equal(ts.Read(4), "aaaa");
                assert.equal(ts.Read(4), "bbbb");
                assert.equal(ts.Read(4), "cccc");
                assert.equal(ts.Read(4), "dddd");

                done();
            });

            it("should throw 'bad file mode' if opened in write-mode", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_bad_file_mode: () => {
                            throw new Error("read mode disabled");
                        }
                    }});

                let ts = new TextStream(ctx, "C:\\foo.txt", CANNOT_READ, CAN_WRITE);

                assert.throws(() => ts.Read(1), "read mode disabled");

                done();
            });

            it("should throw if #Read is called beyond the bounds of the stream", (done) => {

                const contents = "aaaabbbb";

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_input_past_end_of_file: () => {
                            throw new Error("read attempted at EOS");
                        }
                    }});

                ctx.vfs.AddFile("C:\\foo.txt", contents);
                let ts = new TextStream(ctx, "C:\\foo.txt");

                assert.equal(ts.Read(8), contents);
                assert.throws(() => ts.Read(1), "read attempted at EOS");

                done();
            });

            it("should read up to the EOS if the num-chars are greater than stream length", (done) => {

                context.vfs.AddFile("C:\\foo.txt", "1234567890");
                let ts = new TextStream(context, "C:\\foo.txt");

                assert.equal(ts.Read(6), "123456");
                assert.equal(ts.Read(6), "7890");

                done();
            });
        });

        describe("#ReadAll", () => {

            it("should throw 'bad file mode' if opened in write-mode", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_bad_file_mode: () => {
                            throw new Error("read all: read mode forbidden");
                        }
                    }});

                let ts = new TextStream(ctx, "C:\\foo.txt", CANNOT_READ, CAN_WRITE);

                assert.throws(() => ts.ReadAll(), "read all: read mode forbidden");

                done();
            });

            it("should throw a 'bad file mode' if #ReadAll is called on an empty file", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_bad_file_mode: () => {
                            throw new Error("read all: read mode forbidden");
                        }
                    }});

                ctx.vfs.AddFile("C:\\empty.txt");
                let ts = new TextStream(ctx, "C:\\empty.txt");

                assert.throws(() => ts.ReadAll(), "read all: read mode forbidden");

                done();
            });

            it("should read all chars from the file", (done) => {

                const contents = "aaaabbbb\r\nccccdddd";

                context.vfs.AddFile("C:\\foo.txt", contents);
                let ts = new TextStream(context, "C:\\foo.txt");

                assert.equal(ts.ReadAll(), contents);

                done();
            });

            it("should throw if #ReadAll is called twice", (done) => {

                const contents = "aaaabbbb\r\nccccdddd";

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_input_past_end_of_file: () => {
                            throw new Error("at EOS");
                        }
                    }});

                ctx.vfs.AddFile("C:\\foo.txt", contents);
                let ts = new TextStream(ctx, "C:\\foo.txt");

                assert.equal(ts.ReadAll(), contents);
                assert.throws(() => ts.ReadAll(), "at EOS");

                done();
            });
        });

        describe("#ReadLine", () => {

            it("should throw if the file is open in write-mode", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_bad_file_mode: () => {
                            throw new Error("read line: read mode forbidden");
                        }
                    }});

                let ts = new TextStream(ctx, "C:\\foo.txt", CANNOT_READ, CAN_WRITE);

                assert.throws(() => ts.ReadLine(), "read line: read mode forbidden");

                done();
            });

            it("should successfully read the first line", (done) => {

                context.vfs.AddFile("C:\\multi-line.txt", "aaaa\r\nbbbb\r\ncccc\r\n");
                let ts = new TextStream(context, "C:\\multi-line.txt");

                assert.equal(ts.ReadLine(), "aaaa");
                assert.equal(ts.ReadLine(), "bbbb");
                assert.equal(ts.ReadLine(), "cccc");

                done();
            });

            it("should throw if a read is attempted past the EOF", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_input_past_end_of_file: () => {
                            throw new Error("read past EOF");
                        }
                    }});

                ctx.vfs.AddFile("C:\\multi-line.txt", "aaaa\r\nbbbb\r\n");

                let ts = new TextStream(ctx, "C:\\multi-line.txt");

                assert.doesNotThrow(() => ts.ReadLine());
                assert.doesNotThrow(() => ts.ReadLine());

                assert.throws(() => ts.ReadLine(), "read past EOF");

                done();
            });

            it("should throw if the file is empty", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_input_past_end_of_file: () => {
                            throw new Error("empty file");
                        }
                    }});

                ctx.vfs.AddFile("C:\\empty.txt");

                let ts = new TextStream(ctx, "C:\\empty.txt");

                assert.throws(() => ts.ReadLine(), "empty file");

                done();
            });

            it("should not re-sync the file between reads if the file changes on disk", (done) => {

                context.vfs.AddFile("C:\\file.txt", "aaaa\r\nbbbb\r\ncccc");

                let ts = new TextStream(context, "C:\\file.txt");

                assert.equal(ts.ReadLine(), "aaaa");

                // Update the file...
                context.vfs.AddFile("C:\\file.txt", "aaa\r\nZZZZ\r\ncccc");

                assert.equal(ts.ReadLine(), "bbbb");

                done();
            });
        });

        describe("#Skip", () => {

            it("should throw if called while the stream is in write-only mode", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_bad_file_mode: () => {
                            throw new Error("cannot call #Skip in write-only mode");
                        }
                    }});

                ctx.vfs.AddFile("C:\\foo.txt", "contents...");

                let ts = new TextStream(ctx, "C:\\foo.txt", CANNOT_READ, CAN_WRITE);

                assert.throws(() => ts.Skip(5), "cannot call #Skip in write-only mode");

                done();
            });

            it("should skip the correct number of characters", (done) => {

                context.vfs.AddFile("C:\\foo.txt", "aaaabbbbccccdddd");

                let ts = new TextStream(context, "C:\\foo.txt");

                assert.equal(ts.Read(2), "aa");
                ts.Skip(2);
                assert.equal(ts.Read(4), "bbbb");
                ts.Skip(4);
                assert.equal(ts.Read(4), "dddd");

                done();
            });

            it("should throw if supplied an invalid (negative number) argument", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_invalid_fn_arg: () => {
                            throw new Error("negative numbers not allowed");
                        }
                    }});

                ctx.vfs.AddFile("C:\\empty.txt");

                let ts = new TextStream(ctx, "C:\\empty.txt");

                assert.throws(() => ts.Skip(-10), "negative numbers not allowed");

                done();
            });

            it("should not advance the stream ptr if passed a zero skip value", (done) => {

                context.vfs.AddFile("C:\\foo.txt", "abcd");

                let ts = new TextStream(context, "C:\\foo.txt");

                ts.Skip(0);
                assert.equal(ts.Read(1), "a");

                ts.Skip(0);
                assert.equal(ts.Read(1), "b");

                ts.Skip(0);
                assert.equal(ts.Read(1), "c");

                ts.Skip(0);
                assert.equal(ts.Read(1), "d");

                done();
            });
        });

        describe("#SkipLine", () => {

            it("should throw if the file is open in write-mode", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_bad_file_mode: () => {
                            throw new Error("cannot skipline in write-only mode");
                        }
                    }});

                let ts = new TextStream(ctx, "C:\\foo.txt", CANNOT_READ, CAN_WRITE);

                assert.throws(() => ts.SkipLine(), "cannot skipline in write-only mode");

                done();
            });

            it("should successfully skip lines when called", (done) => {

                context.vfs.AddFile("C:\\skipline.txt", "aaaa\r\nbbbb\r\ncccc\r\n");

                let ts = new TextStream(context, "C:\\skipline.txt");

                ts.SkipLine();
                assert.equal(ts.Read(4), "bbbb");

                ts.SkipLine();
                assert.equal(ts.Read(4), "cccc");

                done();
            });

            it("should throw if the file to read is empty", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_bad_file_mode: () => {
                            throw new Error("empty file");
                        }
                    }});

                ctx.vfs.AddFile("C:\\empty.txt");

                let ts = new TextStream(ctx, "C:\\empty.txt");

                assert.throws(() => ts.SkipLine(), "empty file");

                done();
            });

            it("should throw if SkipLine is attempted beyond the end of the stream", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_input_past_end_of_file: () => {
                            throw new Error("skip beyond length of stream");
                        }
                    }});

                ctx.vfs.AddFile("C:\\file.txt", "aaaa\r\nbbbb\r\ncccc\r\n");

                let ts = new TextStream(ctx, "C:\\file.txt");

                assert.doesNotThrow(() => ts.SkipLine());
                assert.doesNotThrow(() => ts.SkipLine());
                assert.doesNotThrow(() => ts.SkipLine());

                assert.throws(() => ts.SkipLine(), "skip beyond length of stream");

                done();
            });

        });

        describe("#Write", () => {

            it("should throw if #Write is attempted on a read-only stream", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_bad_file_mode: () => {
                            throw new Error("cannot call #Write in read-only mode");
                        }
                    }});

                ctx.vfs.AddFile("C:\\foo.txt", "contents...");

                let ts = new TextStream(ctx, "C:\\foo.txt", CAN_READ, CANNOT_WRITE);

                assert.throws(() => ts.Write("hello"), "cannot call #Write in read-only mode");

                done();
            });

            it("should overwrite the contents of a file if opened in write mode", (done) => {

                context.vfs.AddFile("C:\\overwrite.txt", "overwriteme");

                let ts = new TextStream(context, "C:\\overwrite.txt", CANNOT_READ, CAN_WRITE);

                assert.equal(context.vfs.ReadFileContents("C:\\overwrite.txt"), "overwriteme");

                ts.Write("hello, world!");
                assert.equal(context.vfs.ReadFileContents("C:\\overwrite.txt"), "hello, world!");

                done();
            });


            it("should only encode text after existing content when opened in append mode", () => {

                context.vfs.AddFile("C:\\file.txt", "AAAA");

                const UNICODE = true,
                      PERSIST = true;

                let ts = new TextStream(context,
                                        "C:\\file.txt",
                                        CANNOT_READ,
                                        CAN_APPEND,
                                        UNICODE,
                                        PERSIST);

                assert.deepEqual(
                    context.vfs.ReadFileContents("C:\\file.txt"),
                    Buffer.from("AAAA")
                );

                ts.Write("BBBB");

                assert.deepEqual(
                    context.vfs.ReadFileContents("C:\\file.txt"),
                    Buffer.from([
                        0x41, 0x41, 0x41, 0x41,
                        0x42, 0x00, 0x42, 0x00,
                        0x42, 0x00, 0x42, 0x00
                    ])
                );

                ts.write("CCCC");

                assert.deepEqual(
                    context.vfs.ReadFileContents("C:\\file.txt"),
                    Buffer.from([
                        0x41, 0x41, 0x41, 0x41,
                        0x42, 0x00, 0x42, 0x00,
                        0x42, 0x00, 0x42, 0x00,
                        0x43, 0x00, 0x43, 0x00,
                        0x43, 0x00, 0x43, 0x00
                    ])
                );
            });

            it("should continually update the file after each call to #Write", (done) => {

                context.vfs.AddFile("C:\\file.txt");

                let ts = new TextStream(context, "C:\\file.txt", CANNOT_READ, CAN_WRITE);

                ts.Write("aaaa");
                assert.equal(context.vfs.ReadFileContents("C:\\file.txt"), "aaaa");

                ts.Write("bbbb");
                assert.equal(context.vfs.ReadFileContents("C:\\file.txt"), "aaaabbbb");

                ts.Write("cccc");
                assert.equal(context.vfs.ReadFileContents("C:\\file.txt"), "aaaabbbbcccc");

                done();
            });

            it("should keep appending after each write in append mode.", () => {

                context.vfs.AddFile("C:\\file.txt", "AAAA");

                const ts = new TextStream(context, "C:\\file.txt", false, CAN_APPEND);

                assert.equal(context.vfs.ReadFileContents("C:\\file.txt"), "AAAA");

                ts.Write("BBBB");
                assert.equal(context.vfs.ReadFileContents("C:\\file.txt"), "AAAABBBB");

                ts.Write("CCCC");
                assert.equal(context.vfs.ReadFileContents("C:\\file.txt"), "AAAABBBBCCCC");
            });

            it("should append only to the file when opened in append mode", (done) => {

                context.vfs.AddFile("C:\\file.txt", "aaaa");

                let ts = new TextStream(context, "C:\\file.txt", CANNOT_READ, CAN_APPEND);

                ts.Write("bbbb");

                assert.equal(context.vfs.ReadFileContents("C:\\file.txt"), "aaaabbbb");
                done();
            });

            it("should convert numbers to strings before writing them", (done) => {

                let ts = new TextStream(context, "C:\\file.txt", CANNOT_READ, CAN_WRITE);

                ts.Write("aaaa");
                ts.Write(10);

                assert.equal(context.vfs.ReadFileContents("C:\\file.txt"), "aaaa10");

                done();
            });

            it("should auto-join an array in to a single string if an array is passed", (done) => {

                let ts = new TextStream(context, "C:\\file.txt", CANNOT_READ, CAN_WRITE);

                ts.Write([
                    "hello",
                    "world",
                    42
                ]);

                assert.equal(context.vfs.ReadFileContents("C:\\file.txt"), "helloworld42");

                done();
            });

            it("should write '[object Object]' to the file if an obj is passed", (done) => {

                let ts = new TextStream(context, "C:\\file.txt", CANNOT_READ, CAN_WRITE);

                ts.Write({});
                assert.equal(context.vfs.ReadFileContents("C:\\file.txt"), "[object Object]");

                done();
            });
        });

        describe("#WriteBlankLines", () => {

            it("should throw if #WriteBlankLines is attempted on a read-only stream", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_bad_file_mode: () => {
                            throw new Error("cannot call #WriteBlankLines in read-only mode");
                        }
                    }});

                ctx.vfs.AddFile("C:\\foo.txt", "contents...");

                let ts = new TextStream(ctx, "C:\\foo.txt", CAN_READ, CANNOT_WRITE);

                assert.throws(() =>
                              ts.WriteBlankLines(2),
                              "cannot call #WriteBlankLines in read-only mode"
                             );
                done();
            });

            it("should write the total number of blank lines to the file", (done) => {

                context.vfs.AddFile("C:\\linetest.txt");

                let ts = new TextStream(context, "C:\\linetest.txt", CANNOT_READ, CAN_WRITE);

                ts.WriteBlankLines(2);
                assert.deepEqual(
                    context.vfs.ReadFileContents("C:\\linetest.txt"),
                    Buffer.from("\r\n\r\n")
                );

                ts.WriteBlankLines(3);
                assert.deepEqual(
                    context.vfs.ReadFileContents("C:\\linetest.txt"),
                    Buffer.from("\r\n\r\n\r\n\r\n\r\n")
                );

                done();
            });
        });

        describe("#WriteLine", () => {

            it("should throw if #WriteLine is attempted on a read-only stream", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_bad_file_mode: () => {
                            throw new Error("cannot call #WriteLine in read-only mode");
                        }
                    }});

                ctx.vfs.AddFile("C:\\foo.txt", "contents...");

                let ts = new TextStream(ctx, "C:\\foo.txt", CAN_READ, CANNOT_WRITE);

                assert.throws(
                    () => ts.WriteLine("hello"), "cannot call #WriteLine in read-only mode"
                );

                done();
            });

            it("should successfully write text with a newline", (done) => {

                context.vfs.AddFile("C:\\file.txt");

                let ts = new TextStream(context, "C:\\file.txt", CANNOT_READ, CAN_WRITE);

                ts.WriteLine("abcd");
                ts.WriteLine("1234");

                assert.equal(context.vfs.ReadFileContents("C:\\file.txt"), "abcd\r\n1234\r\n");
                done();
            });
        });
    });
});
