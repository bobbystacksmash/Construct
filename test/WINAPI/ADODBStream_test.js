const assert = require("chai").assert;
const ADODBStream = require("../../src/winapi/ADODBStream");
const VirtualFileSystem = require("../../src/runtime/virtfs");

let context = {
    epoch: 1234567890,
    emitter: { emit: () => {} },
    exceptions: {
    },
    vfs: {}
};

const vfs_factory = () => new VirtualFileSystem({ register: () => {} });

const BINARY_STREAM = 1;
const TEXT_STREAM   = 2;

describe("ADODBStream", () => {

    describe("methods", () => {

        describe("#Open", () => {

            it("should be case-insensitive", (done) => {

                let ado = new ADODBStream(context);

                assert.doesNotThrow(() => ado.open());
                ado.close();

                assert.doesNotThrow(() => ado.Open());
                ado.close();

                assert.doesNotThrow(() => ado.OPEN());
                ado.close();

                done();
            });

            it("should throw when opening an already open stream", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_operation_not_allowed_when_object_is_open: () => {
                            throw new Error("Operation not allowed when the object is open.");
                        }
                    }
                });

                let ado = new ADODBStream(ctx);

                assert.doesNotThrow(() => ado.open());

                assert.throws(() => ado.open(), "Operation not allowed when the object is open.");
                done();
            });
        });

        describe("#Close", () => {

            it("should throw when trying to close an already closed stream", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_operation_not_allowed_when_closed: () => {
                            throw new Error("stream already closed");
                        }
                    }});

                let ado = new ADODBStream(ctx);

                ado.open();
                assert.doesNotThrow(() => ado.close());
                assert.throws(() => ado.close(), "stream already closed");

                done();
            });
        });

        describe("#Write", () => {

            it("should throw if attempting to call #Write when the stream-type is text", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_args_wrong_type_or_out_of_range_or_conflicted: () => {
                            throw new Error("cannot call write in text mode");
                        }
                    }});

                let ado = new ADODBStream(ctx);
                ado.type = TEXT_STREAM;
                ado.open();

                assert.throws(() => ado.write("testing"), "cannot call write in text mode");

                done();
            });

            it("should throw if calling write in a binary stream", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_args_wrong_type_or_out_of_range_or_conflicted: () => {
                            throw new Error("cannot call write on a binary stream");
                        }
                    }});

                let ado = new ADODBStream(ctx);
                ado.type = BINARY_STREAM;
                ado.open();

                assert.throws(() => ado.write("testing"), "cannot call write on a binary stream");

                done();
            });
        });

        describe("#WriteText", () => {

            it("should allow writing of text when stream type is text", (done) => {

                let ado = new ADODBStream(context);
                ado.type = TEXT_STREAM;
                ado.open();

                assert.equal(ado.position, 0);
                assert.equal(ado.size, 0);

                assert.doesNotThrow(() => ado.WriteText("abcd"));

                assert.equal(ado.size, 10);
                assert.equal(ado.position, 10);

                done();
            });

            it("should throw if the stream type is binary and #WriteText is called", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_operation_not_permitted_in_contex: () => {
                            throw new Error("cannot call writetext on a binary stream");
                        }
                    }});

                let ado = new ADODBStream(ctx);
                ado.type = BINARY_STREAM;
                ado.open();

                assert.throws(() => ado.WriteText("testing"), "cannot call writetext on a binary stream");

                assert.equal(ado.position, 0);
                assert.equal(ado.size, 0);

                done();
            });

            it("should allow the writing of text to the stream with the default character encoding", (done) => {

                let ado = new ADODBStream(context);
                ado.type = TEXT_STREAM;
                ado.open();

                ado.WriteText("abcd");
                assert.equal(ado.size, 10);
                assert.equal(ado.position, 10);

                done();
            });

            it("should correctly handle being passed an object '{}'", (done) => {

                let ado = new ADODBStream(context);
                ado.type = TEXT_STREAM;
                ado.open();

                assert.doesNotThrow(() => ado.WriteText({}));

                assert.equal(ado.size, 32);
                assert.equal(ado.position, 32);

                ado.position = 0;
                assert.equal(ado.ReadText(), "[object Object]");

                done();
            });

            it("should correctly handle being passed an empty array '[]'", (done) => {

                let ado = new ADODBStream(context);
                ado.type = TEXT_STREAM;
                ado.open();

                assert.doesNotThrow(() => ado.WriteText([]));

                assert.equal(ado.size, 2);
                assert.equal(ado.position, 2);

                ado.position = 0;
                assert.equal(ado.ReadText(), "");

                done();
            });

            it("should correctly handle being passed 'undefined'", (done) => {

                let ado = new ADODBStream(context);
                ado.type = TEXT_STREAM;
                ado.open();

                assert.doesNotThrow(() => ado.WriteText(undefined));

                assert.equal(ado.size, 2);
                assert.equal(ado.position, 2);

                ado.position = 0;
                assert.equal(ado.ReadText(), "");

                done();
            });

            it("should throw when passed 'null'", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_type_mismatch: () => {
                            throw new Error("type mismatch");
                        }
                    }});

                let ado = new ADODBStream(ctx);
                ado.type = TEXT_STREAM;
                ado.open();

                assert.throws(() => ado.WriteText(null), "type mismatch");

                assert.equal(ado.size, 0);
                assert.equal(ado.position, 0);

                done();
            });

            describe("StreamWriteEnum (option)", () => {

                it("should not add any new lines by default", (done) => {

                    let ado = new ADODBStream(context);
                    ado.open();
                    ado.type = TEXT_STREAM;

                    ado.WriteText("abcd");
                    assert.equal(ado.size, 10);
                    assert.equal(ado.position, 10);

                    ado.position = 0;
                    assert.equal(ado.ReadText(), "abcd");

                    done();
                });

                it("should write what ever is specified in the LineSeparator property by default", (done) => {

                    let ado = new ADODBStream(context);

                    ado.open();
                    ado.WriteText("abcd", 1);

                    assert.equal(ado.size, 14);
                    assert.equal(ado.position, 14);

                    done();
                });

                it("should throw if option value to #WriteText is not '1'", (done) => {

                    let ctx = Object.assign({}, context, {
                        exceptions: {
                            throw_args_wrong_type_or_out_of_range_or_conflicted: () => {
                                throw new Error("invalid StreamWriteEnum value");
                            }
                        }});

                    let ado = new ADODBStream(ctx);
                    ado.open();
                    ado.type = TEXT_STREAM;

                    assert.throws(() => ado.WriteText("abcd", 2), "invalid StreamWriteEnum value");

                    done();
                });
            });
        });

        describe("#Read", () => {

            it("should return type 'object' when #Read is called", (done) => {

                let ado = new ADODBStream(context);

                ado.type = BINARY_STREAM;
                ado.open();

                assert.equal(typeof ado.Read(), "object");
                done();
            });

            it("should throw when #Read is called and the stream is closed", (done) => {


                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_operation_not_allowed_when_closed: () => {
                            throw new Error("stream is closed");
                        }
                    }});

                let ado = new ADODBStream(ctx);
                ado.type = BINARY_STREAM;

                assert.throws(() => ado.read(), "stream is closed");
                done();
            });

            it("should throw when called when type is text", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_operation_not_permitted_in_context: () => {
                            throw new Error("cannot call read in text mode");
                        }
                    }});

                let ado = new ADODBStream(ctx);

                ado.open();
                ado.type = TEXT_STREAM;

                assert.throws(() => ado.Read(), "cannot call read in text mode");

                done();

            });

            it("should read throw if 'null' is passed in to #Read", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_type_mismatch: () => {
                            throw new Error("null is not a valid #Read parameter");
                        }
                    }});

                let ado = new ADODBStream(ctx);
                assert.throws(() => ado.Read(null), "null is not a valid #Read param");

                done();
            });

            it("should not throw if 'undefined' is passed in to #Read", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_operation_not_allowed_when_closed: () => {
                            throw new Error("not allowed when closed");
                        }
                    }});

                let ado = new ADODBStream(ctx);
                assert.throws(() => ado.Read(undefined), "not allowed when closed");

                done();
            });

            it("should throw a TypeMismatch error for different truthy values", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_type_mismatch: () => {
                            throw new Error("snakes");
                        }
                    }});

                let ado = new ADODBStream(ctx);
                assert.throws(() => ado.Read([]));
                assert.throws(() => ado.Read({}));
                assert.throws(() => ado.Read("abc"));

                done();
            });

            it("should return 'null' for certain #Read parameters", (done) => {

                let ado = new ADODBStream(context);
                ado.open();
                ado.type = BINARY_STREAM;

                assert.isNull(ado.Read(-1));
                assert.isNull(ado.Read(false));

                done();
            });

            //
            // We are limited here in what we can test because JScript
            // doesn't support reading the contents of a BinaryStream
            // in to a JScript-native data structure.  Using `typeof
            // x', where `x' is a value successfully #Read from a
            // binstream will return 'unknown'.  This is due to the
            // fact that the actual value is the other side of a "COM
            // bridge", meaning we've got no way of knowing what it is.
            //

            it("should correctly read a binary stream", (done) => {

                let vfs = vfs_factory(),
                    ctx = Object.assign({}, context, { vfs: vfs });

                let ado = new ADODBStream(ctx);
                ado.type = BINARY_STREAM;
                ado.open();

                vfs.AddFile("C:\\test.txt", Buffer.from([61, 62, 63, 64]));
                ado.LoadFromFile("C:\\test.txt");

                assert.equal(ado.position, 0);
                ado.Read(1);

                assert.equal(ado.position, 1);
                ado.Read(2);

                assert.equal(ado.position, 3);

                ado.Read(4);
                assert.equal(ado.position, 4);

                done();
            });

            it("should correctly convert a string containing a number to a number", (done) => {

                let vfs = vfs_factory(),
                    ctx = Object.assign({}, context, { vfs: vfs });

                let ado = new ADODBStream(ctx);
                ado.type = BINARY_STREAM;
                ado.open();

                vfs.AddFile("C:\\test.txt", Buffer.from([61, 62, 63, 64]));
                ado.LoadFromFile("C:\\test.txt");

                assert.doesNotThrow(() => ado.Read("1"));
                assert.equal(ado.position, 1);

                assert.doesNotThrow(() => ado.Read("4"));
                assert.equal(ado.position, 4);

                done();
            });

            it("should throw when trying to read a string which cannot be converted to a decimal value", (done) => {

                let vfs = vfs_factory();

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_type_mismatch: () => {
                            throw new Error("read value cannot be converted to a number");
                        }
                    }});

                ctx.vfs = vfs;

                vfs.AddFile("C:\\test.txt", Buffer.from([61, 62, 63, 64]));

                let ado = new ADODBStream(ctx);
                ado.type = BINARY_STREAM;
                ado.open();

                ado.LoadFromFile("C:\\test.txt");

                assert.throws(() => ado.Read("testing"), "read value cannot be converted to a number");

                done();
            });

            it("should correctly handle the case where #Read is passed 'true'", (done) => {

                let vfs = vfs_factory(),
                    ctx = Object.assign({}, context, { vfs: vfs });

                let ado = new ADODBStream(ctx);
                ado.type = BINARY_STREAM;
                ado.open();

                vfs.AddFile("C:\\test.txt", Buffer.from([61, 62, 63, 64]));
                ado.LoadFromFile("C:\\test.txt");

                assert.equal(ado.position, 0);
                assert.doesNotThrow(() => ado.Read(true));
                assert.equal(ado.position, 4);

                done();
            });

            it("should return 'null' when asked to #Read(false)", (done) => {

                let vfs = vfs_factory(),
                    ctx = Object.assign({}, context, { vfs: vfs });

                let ado = new ADODBStream(ctx);
                ado.type = BINARY_STREAM;
                ado.open();

                vfs.AddFile("C:\\test.txt", Buffer.from([61, 62, 63, 64]));
                ado.LoadFromFile("C:\\test.txt");

                assert.equal(ado.position, 0);
                var result = true;
                assert.doesNotThrow(() => result = ado.Read(false));
                assert.equal(ado.position, 0);
                assert.isNull(result);

                done();
            });
        });

        describe("#ReadText", () => {

            it("should throw when called on a binary stream instance", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_operation_not_permitted_in_context: () => {
                            throw new Error("cannot call #Read in binary mode");
                        }
                    }});

                let ado = new ADODBStream(ctx);
                ado.open();
                ado.type = BINARY_STREAM;

                assert.throws(() => ado.ReadText(), "cannot call #Read in binary mode");

                done();
            });

            it("should throw when in text mode but the stream is closed", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_operation_not_permitted_in_context: () => {
                            throw new Error("cannot call #Read when stream is closed");
                        }
                    }});

                let ado = new ADODBStream(ctx);
                ado.type = TEXT_STREAM;

                assert.throws(() => ado.ReadText(), "cannot call #Read when stream is closed");

                done();
            });

            it("should return all chars when no num is specified and pos is 0", (done) => {

                let ado = new ADODBStream(context);
                ado.type = TEXT_STREAM;
                ado.open();

                ado.WriteText("Hello, World!");

                assert.equal(ado.size, 28);
                assert.equal(ado.position, 28);

                ado.position = 0;
                assert.equal(ado.ReadText(), "Hello, World!");

                done();
            });

            it("should return all chars from pos until the end", (done) => {

                let ado = new ADODBStream(context);
                ado.type = TEXT_STREAM;
                ado.open();

                ado.WriteText("Hello, World!");
                ado.position = 12;

                assert.equal(ado.ReadText(), ", World!");

                done();
            });

            it("should return the number of chars when charset is Unicode", (done) => {

                let ado = new ADODBStream(context);

                ado.open();
                ado.type = TEXT_STREAM;
                ado.charset = "Unicode";

                // Unicode chars are 2-bytes wide.

                ado.WriteText("Hello, World!");
                ado.position = 16;

                assert.equal(ado.ReadText(5), "World");

                done();
            });

            it("should return the correct number of chars when the charset is ASCII", (done) => {

                let ado = new ADODBStream(context);

                ado.open();
                ado.type = TEXT_STREAM;
                ado.charset = "ASCII";

                ado.WriteText("Hello, World!");
                ado.position = 7;

                assert.equal(ado.ReadText(5), "World");
                done();
            });

            it("should correctly handle reading more chars than are available", (done) => {

                let ado = new ADODBStream(context);
                ado.open();
                ado.type = TEXT_STREAM;

                ado.WriteText("Hello, World!");
                ado.position = 20;

                assert.equal(ado.ReadText(200), "rld!");
                done();
            });

            it("should return a zero-width (empty) string when pos it at the end", (done) => {

                let ado = new ADODBStream(context);
                ado.open();
                ado.type = TEXT_STREAM;

                ado.WriteText("Hello, World!");
                ado.position = ado.size;

                let res = ado.ReadText();

                assert.equal(res, "");
                assert.equal(res.length, 0);
                assert.isString(res);

                done();
            });
        });

        describe("#Flush", () => {

            it("should throw if the stream is not open", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_operation_not_allowed_when_object_is_open: () => {
                            throw new Error("stream is closed");
                        }
                    }});

                let ado = new ADODBStream(ctx);
                assert.throws(() => ado.Flush(), "stream is closed");

                done();
            });

            it("should throw if any parameters are passed to #Flush", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("too many params passed to flush");
                        }
                    }});

                let ado = new ADODBStream(ctx);
               ado.open();

                assert.throws(() => ado.flush(1),       "too many params passed to flush");
                assert.throws(() => ado.flush(1, 2, 3), "too many params passed to flush");
                assert.throws(() => ado.flush(null),    "too many params passed to flush");

               done();
            });
        });

        describe("#CopyTo", () => {

            it("should copy from one text stream to another successfully", (done) => {

                let foo = new ADODBStream(context),
                    bar = new ADODBStream(context);

                foo.open();
                bar.open();

                foo.charset = "ASCII";
                foo.WriteText("abcd");

                assert.equal(foo.size, 4);
                assert.equal(foo.position, 4);
                assert.equal(foo.charset, "ASCII");
                foo.position = 0;

                assert.equal(bar.size, 0);
                assert.equal(bar.position, 0);

                foo.CopyTo(bar);

                assert.equal(bar.charset, "Unicode");
                assert.equal(bar.size, 10);
                assert.equal(bar.position, 10);

                bar.position = 0;
                assert.equal(bar.ReadText(), "abcd");

                done();
            });

            it("should correctly copy for the right number of chars in Unicode mode", (done) => {

                let foo = new ADODBStream(context),
                    bar = new ADODBStream(context);

                foo.open();
                bar.open();

                foo.WriteText("abcdefghijklmnopqrstuvwxyz");
                foo.position = 10;

                assert.equal(foo.position, 10);
                assert.equal(foo.size, 54);

                foo.CopyTo(bar, 10);

                assert.equal(bar.size, 22);
                assert.equal(bar.position, 22);

                done();
            });

            it("should throw if the src stream is not open", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_operation_not_allowed_when_closed: () => {
                            throw new Error("src stream closed");
                        }
                    }});

                let foo = new ADODBStream(ctx),
                    bar = new ADODBStream(context);

                foo.open();
                bar.open();

                foo.WriteText("abcdefghijklmnopqrstuvwxyz");
                foo.position = 10;

                assert.equal(foo.position, 10);
                assert.equal(foo.size, 54);

                foo.Close();

                assert.throws(() => foo.CopyTo(bar, 10), "src stream closed");

                done();
            });

            it("should throw if the dest stream is not open", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_args_wrong_type_or_out_of_range_or_conflicted: () => {
                            throw new Error("dst stream closed");
                        }
                    }});

                let foo = new ADODBStream(ctx),
                    bar = new ADODBStream(context);

                foo.open();

                foo.WriteText("abcdefghijklmnopqrstuvwxyz");
                foo.position = 10;

                assert.equal(foo.position, 10);
                assert.equal(foo.size, 54);

                assert.throws(() => foo.CopyTo(bar, 10), "dst stream closed");

                done();
            });

            it("should copy successfully from an ASCII text stream to a bin stream", (done) => {

                let txt = new ADODBStream(context),
                    bin = new ADODBStream(context);

                txt.open();
                bin.open();

                txt.type = 2;
                bin.type = 1;

                txt.charset = "ASCII";

                txt.WriteText("abcd");
                txt.position = 0;

                txt.CopyTo(bin);

                assert.equal(bin.size,      4, "Size is correct");
                assert.equal(bin.position, 4, "Position is correct");

                done();
            });



            it("should copy successfully from a Unicode text stream to a bin stream", (done) => {

                let txt = new ADODBStream(context),
                    bin = new ADODBStream(context);

                txt.open();
                bin.open();

                txt.type = 2;
                bin.type = 1;

                txt.WriteText("abcd");
                txt.position = 0;

                txt.CopyTo(bin);

                assert.equal(bin.size,      10, "Size should be 10");
                assert.equal(bin.position, 10, "Position should be 10");

                done();
            });

            it("should correctly copy from bin -> bin", (done) => {

                let vfs = new VirtualFileSystem({ register: () => {} }),
                    ctx = Object.assign({}, context, { vfs: vfs });

                let bin1 = new ADODBStream(ctx),
                    bin2 = new ADODBStream(ctx);

                bin1.type = BINARY_STREAM;
                bin2.type = BINARY_STREAM;

                vfs.AddFile("C:\\test", Buffer.from([0x1, 0x2, 0x3, 0x4]));

                bin1.open();
                bin1.LoadFromFile("C:\\test");

                bin2.open();

                assert.equal(bin1.size, 4);
                assert.equal(bin1.position, 0);

                bin1.CopyTo(bin2);

                assert.equal(bin2.size, bin1.size);
                assert.equal(bin2.position, 4);

                done();
            });

            it("should throw when a binary stream is closed, yet a copy is attempted", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_args_wrong_type_or_out_of_range_or_conflicted: () => {
                            throw new Error("dst stream closed");
                        }
                    }});

                let txt = new ADODBStream(ctx),
                    bin = new ADODBStream(ctx);

                txt.open();
                txt.WriteText("abcd");

                assert.throws(() => txt.CopyTo(bin), "dst stream closed");

                done();
            });
        });

        describe("#SkipLine", () => {

            it("should throw when called in Binary mode", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_operation_not_permitted_in_context: () => {
                            throw new Error("can't call in bin mode");
                        }
                    }});

                let ado = new ADODBStream(ctx);
                ado.type = BINARY_STREAM;

                ado.open();

                assert.throws(() => ado.SkipLine(), "can't call in bin mode");

                done();
            });

            it("should throw when the stream is closed", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_operation_not_allowed_when_closed: () => {
                            throw new Error("can't call while stream is closed");
                        }
                    }});

                let ado = new ADODBStream(ctx);

                assert.throws(() => ado.SkipLine(), "can't call while stream is closed");

                done();
            });

            it("should not throw when the stream is open and empty", (done) => {

                let ado = new ADODBStream(context);
                ado.open();

                assert.doesNotThrow(() => ado.SkipLine());
                assert.isUndefined(ado.SkipLine());
                assert.equal(ado.size, 0);
                assert.equal(ado.position, 0);

                done();
            });

            it("should correctly return each line using the default CRLF linesep", (done) => {

                let ado = new ADODBStream(context);
                ado.open();

                ado.WriteText("abcd\r\nefgh\r\nijkl\r\nmnop");
                ado.position = 0;

                ado.SkipLine();
                assert.equal(ado.position, 14);

                assert.equal(ado.ReadText(4), "efgh");

                ado.position = 14;
                ado.SkipLine();
                assert.equal(ado.position, 26);

                ado.SkipLine();
                assert.equal(ado.position, 38);

                ado.SkipLine();
                assert.equal(ado.position, 46);

                for (let i = 0; i < 10; i++) {
                    ado.SkipLine();
                    assert.equal(ado.position, 46);
                }

                done();
            });

            it("should correctly skip CR strings", (done) => {

                let ado = new ADODBStream(context);
                ado.type = TEXT_STREAM;
                ado.open();
                ado.WriteText("abcd\refgh\r");
                ado.position = 0;

                ado.Lineseparator = 13;

                assert.equal(ado.position, 0);
                ado.SkipLine();
                assert.equal(ado.position, 12);

                ado.SkipLine();
                assert.equal(ado.position, 22);

                ado.SkipLine();
                assert.equal(ado.position, 22);

                done();
            });

            it("should correctly skip LF strings", (done) => {

                let ado = new ADODBStream(context);
                ado.open();
                ado.WriteText("abcd\nefgh\nijkl\n");
                ado.position = 0;

                ado.LineSEPARATOR = 10;

                ado.SkipLine();
                assert.equal(ado.position, 12);

                ado.SkipLine();
                assert.equal(ado.position, 22);

                ado.SkipLine();
                assert.equal(ado.position, 32);

                ado.SkipLine();
                assert.equal(ado.position, 32);

                done();
            });

            it("should skip to the end when the string is ONLY the linesep value", (done) => {

                let ado = new ADODBStream(context);
                ado.open();
                ado.WriteText("\n\n\n\n\n");
                ado.position = 0;

                ado.SkipLine();
                assert.equal(ado.position, 12);

                done();
            });

            it("should skip to the end of the stream when there is no linesep values", (done) => {

                let ado = new ADODBStream(context);
                ado.open();
                ado.WriteText("1234567890");
                ado.position = 0;

                assert.doesNotThrow(() => ado.SkipLine());
                assert.equal(ado.position, 22);
                assert.equal(ado.size, 22);

                done();
            });
        });

        describe("#SetEOS", () => {

            it("should throw when a text stream is closed and SetEOS is called", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_operation_not_allowed_when_closed: () => {
                            throw new Error("can't call SetEOS while stream is closed");
                        }
                    }});

                let ado = new ADODBStream(ctx);
                assert.throws(() => ado.SetEOS(), "can't call SetEOS while stream is closed");
                done();
            });

            it("should throw when a binary stream is closed and SetEOS is called", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_operation_not_allowed_when_closed: () => {
                            throw new Error("can't call SetEOS while stream is closed");
                        }
                    }});

                let ado = new ADODBStream(ctx);
                ado.type = 1;
                assert.throws(() => ado.SetEOS(), "can't call SetEOS while stream is closed");
                done();
            });

            it("should throw if the arg count is > 0", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("invalid argc");
                        }
                    }});

                let ado = new ADODBStream(ctx);
                ado.open();

                assert.throws(() => ado.SetEOS(1),     "invalid argc");
                assert.throws(() => ado.SetEOS(1,2),   "invalid argc");
                assert.throws(() => ado.SetEOS(1,2,3), "invalid argc");

                done();

            });

            it("should not throw if SetEOS is called and the stream is open yet empty", (done) => {

                let ado = new ADODBStream(context);
                ado.Open();
                assert.doesNotThrow(() => ado.SetEOS());
                done();
            });

            it("should update the current pos to be the EOS", (done) => {

                let ado = new ADODBStream(context);
                ado.open();
                ado.type = TEXT_STREAM;
                ado.charset = "ASCII";

                ado.WriteText("1234567890");

                assert.equal(ado.position, 10);
                assert.equal(ado.size, 10);

                ado.position = 5;

                ado.SetEOS();

                assert.equal(ado.size, 5);
                assert.equal(ado.position, 5);

                done();
            });
        });

        describe("#SaveToFile", () => {

            it("should successfully save to the file system", (done) => {

                let mock_vfs = {
                    GetFile: () => {},
                    AddFile: (path, contents) => {
                        assert.equal(path, "C:\\test.txt");
                        assert.instanceOf(contents, Buffer);
                    }
                };

                let ctx = Object.assign({}, context, { vfs: mock_vfs }),
                    ado = new ADODBStream(ctx);

                ado.open();
                ado.WriteText("abcd");

                ado.SaveToFile("C:\\test.txt");

                done();
            });

            // TODO:
            //
            //  - can we call saveToFile on a closed stream()?
            //  - throw if the file already exists on disk
            //  - check charset is applied correctly (no BOM written in ASCII mode)
        });
    });

    /*describe("properties", () => {

        describe(".LineSeparator", () => {

            describe("in binary mode", () => {

                it("should throw when '.LineSeparator' is set", (done) => {

                    let num_linesep_values_tried = 0;

                    function assert_correct_throw_msg () {
                        throw new Error("X");
                        assert.isTrue(true);
                    }

                    let ctx = {};
                    Object.assign(ctx, context, {
                        exceptions: {
                            throw_args_wrong_type_or_out_of_range_or_conflicted: assert_correct_throw_msg
                        }
                    });

                    let ado = new ADODBStream(ctx);
                    ado.type = BINARY_STREAM;
                    ado.open();


                    for (let i = 15; i > -10; i--) {
                        try {
                            ado.lineseparator = i;
                        }
                        catch (e) {
                            num_linesep_values_tried++;
                        }
                    }

                    assert.equal(num_linesep_values_tried, 25);
                    done();
                });
            });

            describe("in text mode", () => {

                it("should allow only LineSeparatorsEnum values", (done) => {

                    function assert_correct_throw_msg () {
                        throw new Error("X");
                    }

                    let ctx = {};
                    Object.assign(ctx, context, {
                        exceptions: {
                            throw_args_wrong_type_or_out_of_range_or_conflicted: assert_correct_throw_msg
                        }
                    });

                    let ado = new ADODBStream(ctx);
                    ado.open();
                    ado.type = TEXT_STREAM;

                    assert.doesNotThrow(() => ado.linesep = 13); // CR
                    assert.doesNotThrow(() => ado.linesep = -1); // CRLF
                    assert.doesNotThrow(() => ado.linesep = 10); // LF

                    assert.throws(() => ado.lineseparator = 'a');
                    assert.throws(() => ado.lineseparator = 0xF);

                    done();
                });

            });
        });
    });

    describe(".EOS", () => {

        it("should indicate when at the end of the stream", (done) => {

            let ado = new ADODBStream(context);
            ado.open();
            ado.writetext("abcd");

            assert.equal(ado.size, 10);
            assert.equal(ado.position, 10);
            assert.equal(ado.eos, true);

            ado.position = 6;
            assert.isFalse(ado.eos);

            done();
        });

    });

    describe(".size", () => {

        it("should throw if size is assigned to", (done) => {

            let ctx = {};
            Object.assign(ctx, context, {
                exceptions: {
                    throw_wrong_argc_or_invalid_prop_assign: () => { throw new Error("x"); }
                }
            });

            let ado = new ADODBStream(ctx);

            assert.throws(() => ado.size = 3);

            ado.open();
            ado.type = TEXT_STREAM;

            ado.writetext("abcd");
            assert.equal(ado.size, 10);

            assert.throws(() => ado.size = 5);

            done();
        });

        it("should report the correct size for a binary stream", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} }),
                ctx = Object.assign({}, context, { vfs: vfs });

            // Add a file, no BOM.
            vfs.AddFile("C:\\blah.txt", Buffer.from("abcd", "ascii"));
            let ado = new ADODBStream(ctx);
            ado.type = BINARY_STREAM;
            ado.open();

            ado.loadfromfile("C:\\blah.txt");

            assert.equal(ado.size, 4);

            done();
        });

        it("should report the correct size for a text stream", (done) => {

            let ado = new ADODBStream(context);

            ado.type = TEXT_STREAM;
            ado.open();
            ado.writetext("abcd");

            assert.equal(ado.size, 10);
            done();
        });

        describe("in mixed mode", () => {

            it("should maintain the correct size when being converted bin -> txt", (done) => {

                let vfs = new VirtualFileSystem({ register: () => {} }),
                    ctx = Object.assign({}, context, { vfs: vfs });

                // Add a file, no BOM.
                vfs.AddFile("C:\\blah.txt", Buffer.from("abcd", "ascii"));

                let ado = new ADODBStream(ctx);
                ado.type = BINARY_STREAM;
                ado.open();

                ado.loadfromfile("C:\\blah.txt");

                assert.equal(ado.size, 4);
                assert.equal(ado.position, 0);

                ado.type = TEXT_STREAM;

                assert.equal(ado.size, 4);
                assert.equal(ado.position, 0);

                done();
            });
        });

        describe("in text mode", () => {

            it("should correctly return the number of bytes in a string (text stream)", (done) => {

                let ado = new ADODBStream(context);
                ado.open();
                ado.writetext("Hello, World!");
                assert.equal(ado.size, 28);

                done();
            });

        });

        describe("in binary mode", () => {

            describe("when loading an ASCII file", () => {

                it("should report the size as the number of bytes (no BOM)", (done) => {

                    let vfs = new VirtualFileSystem({ register: () => {} }),
                        ctx = Object.assign({}, context, { vfs: vfs });

                    vfs.AddFile("C:\\blah.txt", Buffer.from("abcd", "ascii"));

                    let ado = new ADODBStream(ctx);
                    ado.type = BINARY_STREAM;
                    ado.open();

                    ado.loadfromfile("C:\\blah.txt");

                    assert.equal(ado.size, 4);
                    done();
                });
            });

            describe("when loading a UTF-16 file with BOM", () => {

                it("should report the full size, including the BOM", (done) => {

                    let vfs = new VirtualFileSystem({ register: () => {} }),
                        ctx = Object.assign({}, context, { vfs: vfs });

                    vfs.AddFile("C:\\blah.txt", Buffer.from([0xFF, 0xFE, 0x61, 0x00, 0x62, 0x00, 0x63, 0x00, 0x64, 0x00]));

                    let ado = new ADODBStream(ctx);
                    ado.type = BINARY_STREAM;
                    ado.open();

                    ado.loadfromfile("C:\\blah.txt");

                    assert.equal(ado.size, 10);
                    done();
                });

            });

            it("should correctly return the number of bytes loaded from a file", (done) => {

                let vfs = new VirtualFileSystem({ register: () => {} }),
                    ctx = Object.assign({}, context, { vfs: vfs });

                let ado = new ADODBStream(ctx);
                ado.type = BINARY_STREAM;
                ado.open();

                vfs.AddFile("C:\\blah.txt", Buffer.from("Hello, World!", "ascii"));
                ado.loadfromfile("C:\\blah.txt");

                assert.equal(ado.size, "Hello, World!".length);
                done();
            });

            it("should report a size of '0' (zero) for an empty file", (done) => {

                let vfs = new VirtualFileSystem({ register: () => {} }),
                    ctx = Object.assign({}, context, { vfs: vfs });

                let ado = new ADODBStream(ctx);
                ado.type = BINARY_STREAM;
                ado.open();

                vfs.AddFile("C:\\empty.txt", Buffer.alloc(0));
                ado.loadfromfile("C:\\empty.txt");

                assert.equal(ado.size, 0);
                done();
            });

            it("should report size correctly after truncation (via SetEOS)", (done) => {

                let vfs = new VirtualFileSystem({ register: () => {} }),
                    ctx = Object.assign({}, context, { vfs: vfs });

                let ado = new ADODBStream(ctx);
                ado.type = BINARY_STREAM;
                ado.open();

                vfs.AddFile("C:\\blah.txt", Buffer.from("abcd"));
                ado.loadfromfile("C:\\blah.txt");

                assert.equal(ado.size, 4);
                ado.position = 2;
                ado.setEOS();
                assert.equal(ado.size, 2);

                done();
            });

            it("should report size correctly after size has been updated", (done) => {

                let ado = new ADODBStream(context);
                ado.type = TEXT_STREAM;
                ado.charset = "ASCII";
                ado.open();

                ado.writetext("abc");
                assert.equal(ado.size, 3);

                ado.writetext("1234567890");
                assert.equal(ado.size, 13);

                done();
            });
        });
    });

    describe(".Charset", () => {

        // For a more comprehensive set of tests regarding
        // ADODB.Stream charsets, please see the TextStream_test.js
        // file.  We're really only checking that the ADODB.Stream
        // correctly passes-thru the values to its underlying
        // TextStream instance.

        describe("in binary mode", () => {

            it("should throw when trying to GET the charset", (done) => {

                let ctx = {};
                Object.assign(ctx, context, {
                    exceptions: {
                        throw_operation_not_permitted_in_context: () => {
                            throw new Error("x");
                        }
                    }
                });

                let ado = new ADODBStream(ctx);
                ado.type = BINARY_STREAM;

                assert.throws(() => ado.charset);
                done();
            });

            it("should throw when trying to SET the charset", (done) => {

                let ctx = {};
                Object.assign(ctx, context, {
                    exceptions: {
                        throw_operation_not_permitted_in_context: () => {
                            throw new Error("x");
                        }
                    }
                });

                let ado = new ADODBStream(ctx);
                ado.type = BINARY_STREAM;

                assert.throws(() => ado.charset = "ASCII");
                done();
            });
        });

        describe("in text mode", () => {

            it("should throw on charset change when pos != 0", (done) => {

                let ctx = {};
                Object.assign(ctx, context, {
                    exceptions: {
                        throw_args_wrong_type_or_out_of_range_or_conflicted: () => {
                            done();
                            throw new Error("x");
                        }
                    }
                });

                let ado = new ADODBStream(ctx);
                ado.open();
                ado.type =TEXT_STREAM;
                ado.writetext("abcd");
                assert.equal(ado.position, 10);

                try {
                    ado.charset = "ASCII";
                }
                catch (_) {}
            });

            it("should throw if the new charset is unknown", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_args_wrong_type_or_out_of_range_or_conflicted: () => {
                            throw new Error("unknown charset error");
                        }
                    }
                });

                let ado = new ADODBStream(ctx);

                ado.type = TEXT_STREAM;
                ado.open();

                assert.throws(() => ado.charset = "Windows-1252", "unknown charset error");

                assert.doesNotThrow(() => ado.charset = "ASCII");
                assert.doesNotThrow(() => ado.charset = "Unicode");
                assert.doesNotThrow(() => ado.charset = "UnIcOdE");
                done();
            });

            it("should use 'Unicode' by default", (done) => {

                let ado = new ADODBStream(context);
                ado.type = TEXT_STREAM;

                assert.equal(ado.charset, "Unicode");

                done();
            });

            it("should not add the BOM when in ASCII mode", (done) => {

                let ado = new ADODBStream(context);
                ado.type = TEXT_STREAM;
                ado.open();
                ado.charset = "ASCII";

                ado.writetext("");

                assert.equal(ado.size, 0);
                assert.equal(ado.position, 0);

                done();
            });

            it("should add the BOM by default for Unicode strings", (done) => {

                let ado = new ADODBStream(context);
                ado.type = TEXT_STREAM;
                ado.open();

                ado.writetext("");
                assert.equal(ado.size, 2);
                assert.equal(ado.position, 2);

                done();
            });

            it("should support changing encodings from Unicode to ASCII", (done) => {

                let ado = new ADODBStream(context);
                ado.type = TEXT_STREAM;
                ado.open();

                ado.writetext("abcd");
                assert.equal(ado.size, 10);
                assert.equal(ado.position, 10);

                ado.position = 0;
                ado.charset = "ascii";

                assert.equal(ado.size, 10);

                let expected = [ 255, 254, 97, 0, 98, 0, 99, 0, 100, 0 ];

                for (let i = 0; i < ado.size; i++) {
                    assert.equal(ado.readtext(1).charCodeAt(0), expected[i]);
                }

                done();
            });
        });
    });

    describe(".Position", () => {

        describe("when the stream is opened", () => {

            describe("in binary mode", () => {

                it("should throw if '.position' is updated beyond the available size", (done) => {

                    let vfs = new VirtualFileSystem({ register: () => {} });
                    vfs.AddFile("C:\\blah.txt", Buffer.from("abcd", "ascii"));

                    function assert_correct_throw_msg () {
                        assert.isTrue(true);
                        done();
                    }

                    let ctx = {};
                    Object.assign(ctx, context, {
                        vfs: vfs,
                        exceptions: {
                            throw_parameter_is_incorrect: assert_correct_throw_msg
                        }
                    });

                    let ado = new ADODBStream(ctx);
                    ado.open();
                    ado.type = 1;

                    ado.loadfromfile("C:\\blah.txt");
                    assert.equal(ado.size, 4);
                    ado.position = ado.size + 1;
                });
            });

            describe("in text mode", () => {

                it("should throw if '.position' is updated beyond the available size", (done) => {

                    function assert_correct_throw_msg () {
                        assert.isTrue(true);
                        done();
                    }

                    let ctx = {};
                    Object.assign(ctx, context, {
                        exceptions: {
                            throw_parameter_is_incorrect: assert_correct_throw_msg
                        }
                    });

                    let ado = new ADODBStream(ctx);
                    ado.open();
                    ado.writetext("abcd");
                    assert.equal(ado.size, 10);

                    ado.position = ado.size + 1;
                });

                it("should throw if '.position' is set to a negative number", (done) => {

                    function assert_correct_throw_msg () {
                        assert.isTrue(true);
                        done();
                    }

                    let ctx = {};
                    Object.assign(ctx, context, {
                        exceptions: {
                            throw_args_wrong_type_or_out_of_range_or_conflicted: assert_correct_throw_msg
                        }
                    });

                    let ado = new ADODBStream(ctx);
                    ado.open();
                    ado.writetext("Hello, World!");
                    assert.equal(ado.size, 28);
                    ado.position = -10;
                });
            });
        });

        describe("when the stream is closed", () => {

            it("should throw if .position is accessed", (done) => {

                function assert_correct_throw_msg () {
                    done();
                }

                let ctx = {};
                Object.assign(ctx, context, {
                    exceptions: {
                        throw_operation_not_allowed_when_closed: assert_correct_throw_msg
                    }
                });

                let ado = new ADODBStream(ctx);
                assert.throws(() => ado.position);
            });

            it("should throw if .position is assigned-to", (done) => {

                function assert_correct_throw_msg () {
                    done();
                }

                let ctx = {};
                Object.assign(ctx, context, {
                    exceptions: {
                        throw_operation_not_allowed_when_closed: assert_correct_throw_msg
                    }
                });

                let ado = new ADODBStream(ctx);
                assert.throws(() => ado.position = 1);
            });
        });
     });

    describe(".State", () => {

        it("should report the state as '0' by default", (done) => {

            let ado = new ADODBStream(context);

            assert.equal(ado.mode, 0);
            ado.open();
            assert.equal(ado.mode, 0);

            done();
        });

        it("should report the state as '1' when the stream is open", (done) => {

            let ado = new ADODBStream(context);
            assert.equal(ado.state, 0);

            ado.open();
            assert.equal(ado.state, 1);

            ado.close();
            assert.equal(ado.state, 0);

            done();
        });

    });

    describe(".Mode", () => {

        // TODO
        //
        // - if mode is changed to read only and then a write is
        //   attempted, it throws.
        // - mode cannot be SET while stream is open
        // -
        it("should have mode = 0 when object is closed", (done) => {

            let ado = new ADODBStream(context);
            assert.equal(ado.mode, 0);
            done();
        });

        it("should not allow .mode to be set while stream is open", (done) => {

            let ctx = {};
            Object.assign(ctx, context, {
                exceptions: {
                    throw_operation_not_allowed_when_object_is_open: () => {
                        throw new Error("x");
                    }
                }
            });

            let ado = new ADODBStream(ctx);
            ado.open();

            assert.throws(() => ado.mode = 1);
            done();
        });

        it("should throw appropriately when .mode is set to an unknown value", (done) => {

            let ctx = {};
            Object.assign(ctx, context, {
                exceptions: {
                    throw_args_wrong_type_or_out_of_range_or_conflicted: () => {
                        throw new Error("x");
                    }
                }
            });

            let ado = new ADODBStream(ctx);

            assert.throws(() => ado.mode = 1999);
            assert.throws(() => ado.mode = -1);
            assert.throws(() => ado.mode = null);
            assert.throws(() => ado.mode = undefined);
            assert.throws(() => ado.mode = []);
            assert.throws(() => ado.mode = 5);

            assert.doesNotThrow(() => ado.mode = 0);

            done();
        });

        it("should not throw for all valid modes", (done) => {

            let ado = new ADODBStream(context);

            let allowed_values = [
                { constant: "adModeUnknown",        value: 0x0,      desc: "DEFAULT. Permissions not set / cannot be determined." },
                { constant: "adModeRead",           value: 0x1,      desc: "Indicates read-only permissions." },
                { constant: "adModeWrite",          value: 0x2,      desc: "Indicates write-only permissions." },
                { constant: "adModeReadWrite",      value: 0x3,      desc: "Indicates read/write permissions." },
                { constant: "adModeShareDenyRead",  value: 0x4,      desc: "Not implemented (by Construct)." },
                { constant: "adModeShareDenyWrite", value: 0x8,      desc: "Not implemented (by Construct)." },
                { constant: "adModeShareExclusive", value: 0xC,      desc: "Not implemented (by Construct)." },
                { constant: "adModeShareDenyNone",  value: 0x10,     desc: "Not implemented (by Construct)." },
                { constant: "adModeRecursive",      value: 0x400000, desc: "Not implemented (by Construct)." },
            ];

            allowed_values.forEach((x) => assert.doesNotThrow(() => ado.mode = x.value));

            done();
        });

        describe("permissions", () => {

            it("should be set to mode 'adModeUnknown' (0x0) by default, and permit reading and writing", (done) => {

                let ado = new ADODBStream(context);

                ado.open();
                assert.doesNotThrow(() => ado.writetext("abc"));
                ado.position = 0;

                assert.doesNotThrow(() => ado.readtext());

                done();
            });

            it("should not throw if mode is set to 'adModeUnknown' (0x0) and a write is attempted", (done) => {

                let ado = new ADODBStream(context);

                ado.mode = 0x0;
                ado.open();

                assert.doesNotThrow(() => ado.writetext("abc"));

                done();
             });

            it("should throw a 'not open' exception when .Mode is 'adModeRead' but the stream is not open", (done) => {

                let ctx = {};
                Object.assign(ctx, context, {
                    exceptions: {
                        throw_operation_not_allowed_when_closed: () => {
                            throw new Error("Operation not permitted on closed stream.");
                        }
                    }
                });

                let ado = new ADODBStream(ctx);

                ado.mode = 0x1;
                assert.throws(() => ado.writetext("abc"), "Operation not permitted on closed stream.");

                done();
            });

            it("should throw 'Access Denied' when mode is set to 'adModeRead' (0x1) and a write is attempted", (done) => {

                let ctx = {};
                Object.assign(ctx, context, {
                    exceptions: {
                        throw_permission_denied: () => {
                            throw new Error("permission denied");
                        }
                    }
                });

                let ado = new ADODBStream(ctx);

                ado.mode = 0x1;
                ado.open();

                assert.throws(() => ado.writetext("abc"), "permission denied");

                done();
            });

            it("should throw 'operation not permitted' when mode is set to 'adModeWrite' (0x2) and a read is attempted", (done) => {

                let ctx = {};
                Object.assign(ctx, context, {
                    exceptions: {
                        throw_operation_not_permitted_in_context: () => {
                            throw new Error("operation not permitted");
                        }
                    }
                });

                let ado = new ADODBStream(ctx);

                ado.mode = 0x2;
                ado.open();

                assert.doesNotThrow(() => ado.writetext("abc"));

                ado.position = 0;
                assert.throws(() => ado.readtext(), "operation not permitted");

                done();
            });
        });

        it("should allow read/write when 'adModeReadWrite' (0x3) is set", (done) => {

            let ado = new ADODBStream(context);
            ado.mode = 3;

            ado.open();
            assert.doesNotThrow(() => ado.writetext("abc"));

            ado.position = 0;
            assert.doesNotThrow(() => ado.readtext());

            done();
        });
    });

    describe(".Type", () => {

        it("should create a text stream", (done) => {

            let ado = new ADODBStream(context);
            assert.equal(ado.type, TEXT_STREAM);
            done();
        });

        it("should allow changing stream types, only when .position is 0", (done) => {

            let ado = new ADODBStream(context);
            assert.equal(ado.type, TEXT_STREAM);
            ado.type = BINARY_STREAM;
            assert.equal(ado.type, BINARY_STREAM);
            done();
        });

        it("should throw if the stream type is set to an invalid type", (done) => {

            let ctx = Object.assign({}, context, {
                exceptions: {
                    throw_args_wrong_type_or_out_of_range_or_conflicted: () => {
                        throw new Error("x");
                    }
                }
            });

            let ado = new ADODBStream(ctx);
            assert.equal(ado.type, TEXT_STREAM);

            assert.throws(() => ado.type = 10);
            assert.throws(() => ado.type = null);
            assert.throws(() => ado.type = -3);

            done();
        });

        it("should throw if trying to change types without position at 0", (done) => {

            function assert_correct_throw_msg () {
                throw new Error("x");
            }

            let ctx = {};
            Object.assign(ctx, context, {
                exceptions: {
                    throw_operation_not_permitted_in_context: assert_correct_throw_msg
                }
            });

            let ado = new ADODBStream(ctx);
            assert.equal(ado.type, TEXT_STREAM);

            ado.open();
            ado.WriteText("abcd");
            assert.equal(ado.position, 10);

            assert.throws(() => ado.type = 1);

            done();
        });

        it("should throw when trying to 'write' bytes in to a binary stream", (done) => {

            function assert_correct_throw_msg () {
                throw new Error("X");
                assert.isTrue(true);
            }

            let ctx = {};
            Object.assign(ctx, context, {
                exceptions: {
                    throw_args_wrong_type_or_out_of_range_or_conflicted: assert_correct_throw_msg
                }
            });


            let ado = new ADODBStream(ctx);
            ado.type = BINARY_STREAM;
            ado.open();

            assert.throws(() => ado.write("abc"));

            done();
        });
    });*/
});
