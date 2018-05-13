const assert = require("chai").assert;
const TextStream = require("../../src/winapi/TextStream");
const VirtualFileSystem = require("../../src/runtime/virtfs");

// The TextStream most commonly represents a text file, however it can
// also represent any input/output stream, such as stdin or stdout.

var context = null;

const new_vfs = () => new VirtualFileSystem({ register: () => {} });

describe("TextStream", () => {

    // A TextStream can represent either a:
    //
    //   - text file
    //   - input/output stream (such as StdIn, StdOut, and StdErr).
    //

    beforeEach(() => {
        context = {
            epoch: 1234567890,
            emitter: { emit: () => {} },
            exceptions: {
            },
            vfs: {}
        };

        context.vfs = new_vfs();
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

            xit("should flush the stream contents to the file when #Close is called", (done) => {

                context.vfs.AddFile("C:\\foo.txt", "aaaa");
                let ts = new TextStream(context, "C:\\foo.txt");

            });

            // TODO:
            //
            //  - what if an arg is passed to #Close?
            //  - should write the stream contents to the file
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

                const CAN_READ  = false,
                      CAN_WRITE = true;

                let ts = new TextStream(ctx, "C:\\foo.txt", CAN_READ, CAN_WRITE);

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

                const CAN_READ  = false,
                      CAN_WRITE = true;

                let ts = new TextStream(ctx, "C:\\foo.txt", CAN_READ, CAN_WRITE);

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

                const CAN_READ  = false,
                      CAN_WRITE = true;

                let ts = new TextStream(ctx, "C:\\foo.txt", CAN_READ, CAN_WRITE);

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
        });
        describe("#Skip", () => {
            // TODO: add read/write only tests
        });
        describe("#SkipLine", () => {
            // TODO: add read/write only tests
        });
        describe("#Write", () => {
            // TODO: add read/write only tests
        });
        describe("#WriteBlankLines", () => {
            // TODO: add read/write only tests
        });
        describe("#WriteLine", () => {
            // TODO: add read/write only tests
        });
    });
});
