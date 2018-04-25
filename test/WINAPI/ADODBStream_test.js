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

const BINARY_STREAM = 1;
const TEXT_STREAM   = 2;

describe("ADODBStream", () => {

    describe("methods", () => {

        describe("#open", () => {

            // TODO: make sure open() on an already opened stream throws.
        });
    });


    /*describe("properties", () => {

        xdescribe(".LineSeparator", () => {

            xdescribe("in binary mode", () => {

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

        xdescribe(".EOS", () => {

            it("should indicate when at the end of the stream", (done) => {

                let ado = new ADODBStream(context);
                ado.open();
                ado.writetext("Hello, World!");

                assert.equal(ado.position, 26);
                assert.equal(ado.eos, true);

                ado.position = 10;
                assert.isFalse(ado.eos);

                done();
            });

        });*/

    /*describe(".size", () => {

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
    });*/

    /*describe(".Charset", () => {

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

                let ado = new ADODBStream(context);

                ado.type = TEXT_STREAM;
                ado.open();

                assert.throws(() => ado.charset = "Windows-1252");

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
    });*/

    /*describe(".Position", () => {

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
     });*/

    xdescribe(".State", () => {

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
        /*xit("should have mode = 0 when object is closed", (done) => {

            let ado = new ADODBStream(context);
            assert.equal(ado.mode, 0);
            done();
        });

        xit("should not allow .mode to be set while stream is open", (done) => {

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

        xit("should throw appropriately when .mode is set to an unknown value", (done) => {

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

        xit("should not throw for all valid modes", (done) => {

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
        });*/

        describe("permissions", () => {

            /*xit("should not throw if mode is set to 'adModeUnknown' (0x0) and a write is attempted", (done) => {

                let ado = new ADODBStream(context);

                ado.mode = 0x0;
                ado.open();

                assert.doesNotThrow(() => ado.writetext("abc"));

                done();
             });*/

            xit("should throw a 'not open' exception when .Mode is 'adModeRead' but the stream is not open", (done) => {

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
    });

    xdescribe(".Type", () => {

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

            let ctx = {};
            Object.assign(ctx, context, {
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
    });
});
