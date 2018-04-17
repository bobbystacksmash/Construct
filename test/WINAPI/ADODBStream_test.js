const assert = require("chai").assert;
const ADODBStream = require("../../src/winapi/ADODBStream");
const VirtualFileSystem = require("../../src/runtime/virtfs");

let context = {
    epoch: 1234567890,
    emitter: { emit: () => {} },
    exceptions: {
        throw_operation_not_permitted_in_context: () => {}
    },
    vfs: {}
};

const BINARY_STREAM = 1;
const TEXT_STREAM   = 2;

describe("ADODBStream", () => {

    describe("properties", () => {

        xdescribe(".LineSeparator", () => {

            xdescribe("in binary mode", () => {

                it("Should throw when '.LineSeparator' is set", (done) => {

                    let num_linesep_values_tried = 0;

                    function assert_correct_throw_msg () {
                        throw new Error("X");
                        assert.isTrue(true);
                    }

                    let this_context = {};
                    Object.assign(this_context, context, {
                        exceptions: {
                            throw_args_wrong_type_or_out_of_range_or_conflicted: assert_correct_throw_msg
                        }
                    });

                    let ado = new ADODBStream(this_context);
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

                it("Should allow only LineSeparatorsEnum values", (done) => {

                    function assert_correct_throw_msg () {
                        throw new Error("X");
                    }

                    let this_context = {};
                    Object.assign(this_context, context, {
                        exceptions: {
                            throw_args_wrong_type_or_out_of_range_or_conflicted: assert_correct_throw_msg
                        }
                    });

                    let ado = new ADODBStream(this_context);
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

            it("Should indicate when at the end of the stream", (done) => {

                let ado = new ADODBStream(context);
                ado.open();
                ado.writetext("Hello, World!");

                assert.equal(ado.position, 26);
                assert.equal(ado.eos, true);

                ado.position = 10;
                assert.isFalse(ado.eos);

                done();
            });

        });

        xdescribe(".charset", () => {

            // This feature is not fully implemented.

            it("Should allow setting the charset to any value", (done) => {

                let ado = new ADODBStream(context);
                ado.open();
                ado.charset = "UTF-16";

                assert.equal(ado.charset, "UTF-16");
                done();
            });
        });

        describe(".size", () => {

            describe("in mixed mode", () => {

                it("Should maintain the correct size when being converted bin -> txt", (done) => {

                    // TODO
                    //
                    // write ascii file to disk (no BOM)
                    // read ascii file in to binary buffer
                    // convert this buffer to text
                    // test size -- see if BOM is present.
                    //
                    // Tests on windows show the BOM is added - size remains at 4 for 'abcd'.
                    let vfs = new VirtualFileSystem({ register: () => {} }),
                        ctx = Object.assign({}, context, { vfs: vfs });

                    // Add a file, no BOM.
                    vfs.AddFile("C:\\blah.txt", Buffer.from("abcd", "ascii"));

                    let ado = new ADODBStream(ctx);
                    ado.type = BINARY_STREAM;
                    ado.open();

                    ado.loadfromfile("C:\\blah.txt");

                    assert.equal(ado.size, 4);

                    ado.position = 0;
                    ado.type = TEXT_STREAM;

                    assert.equal(ado.size, 4);

                    done();

                });

            });

            describe("in text mode", () => {

                it("Should correctly return the number of bytes in a string (text stream)", (done) => {

                    let ado = new ADODBStream(context);
                    ado.open();
                    ado.writetext("Hello, World!");
                    assert.equal(ado.size, 28);

                    done();
                });

            });

            describe("in binary mode", () => {

                describe("when loading an ASCII file", () => {

                    it("Should report the size as the number of bytes (no BOM)", (done) => {

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

                    it("Should report the full size, including the BOM", (done) => {

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


                it("Should correctly return the number of bytes loaded from a file", (done) => {

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

                it("Should report a size of '0' (zero) for an empty file", (done) => {

                    let vfs = new VirtualFileSystem({ register: () => {} }),
                        ctx = Object.assign({}, context, { vfs: vfs });

                    let ado = new ADODBStream(ctx);
                    ado.type = BINARY_STREAM
                    ado.open();

                    vfs.AddFile("C:\\empty.txt", Buffer.alloc(0));
                    ado.loadfromfile("C:\\empty.txt");

                    assert.equal(ado.size, 0);
                    done();
                });

                xit("Should report size correctly after truncation (via SetEOS)", (done) => {

                    let vfs = new VirtualFileSystem({ register: () => {} }),
                        ctx = Object.assign({}, context, { vfs: vfs });

                    let ado = new ADODBStream(ctx);
                    ado.type = BINARY_STREAM
                    ado.open();

                    vfs.AddFile("C:\\blah.txt", Buffer.from("Hello, World!"));
                    ado.loadfromfile("C:\\blah.txt");

                    assert.equal(ado.size, 15);
                    ado.position = 3;
                    ado.setEOS();
                    assert.equal(ado.size, 5);

                    done();
                });
            });
        });

        xdescribe(".Position", () => {

            describe("when the stream is opened", () => {

                describe("in binary mode", () => {

                    it("Should throw if '.position' is updated beyond the available size", (done) => {

                        let vfs = new VirtualFileSystem({ register: () => {} });
                        vfs.AddFile("C:\\blah.txt", Buffer.from("Hello, World!"));

                        function assert_correct_throw_msg () {
                            assert.isTrue(true);
                            done();
                        }

                        let this_context = {};
                        Object.assign(this_context, context, {
                            vfs: vfs,
                            exceptions: {
                                throw_parameter_is_incorrect: assert_correct_throw_msg
                            }
                        });

                        let ado = new ADODBStream(this_context);
                        ado.open();
                        ado.type = 1;

                        ado.loadfromfile("C:\\blah.txt");
                        assert.equal(ado.size, 15);
                        ado.position = ado.size + 1;
                    });
                });

                describe("in text mode", () => {

                    it("Should throw if '.position' is updated beyond the available size", (done) => {

                        function assert_correct_throw_msg () {
                            assert.isTrue(true);
                            done();
                        }

                        let this_context = {};
                        Object.assign(this_context, context, {
                            exceptions: {
                                throw_parameter_is_incorrect: assert_correct_throw_msg
                            }
                        });

                        let ado = new ADODBStream(this_context);
                        ado.open();
                        ado.writetext("Hello, World!");
                        assert.equal(ado.size, 28);

                        ado.position = ado.size + 1;
                    });

                    it("Should throw if '.position' is set to a negative number", (done) => {

                        function assert_correct_throw_msg () {
                            assert.isTrue(true);
                            done();
                        }

                        let this_context = {};
                        Object.assign(this_context, context, {
                            exceptions: {
                                throw_args_wrong_type_or_out_of_range_or_conflicted: assert_correct_throw_msg
                            }
                        });

                        let ado = new ADODBStream(this_context);
                        ado.open();
                        ado.writetext("Hello, World!");
                        assert.equal(ado.size, 28);
                        ado.position = -10;
                    });
                });
            });

            xdescribe("when the stream is closed", () => {

                it("Should throw if .position is accessed", (done) => {

                    function assert_correct_throw_msg () {
                        done();
                    }

                    let this_context = {};
                    Object.assign(this_context, context, {
                        exceptions: {
                            throw_operation_not_allowed_when_closed: assert_correct_throw_msg
                        }
                    });

                    let ado = new ADODBStream(this_context);
                    assert.throws(() => ado.position);
                });

                it("Should throw if .position is assigned-to", (done) => {

                    function assert_correct_throw_msg () {
                        done();
                    }

                    let this_context = {};
                    Object.assign(this_context, context, {
                        exceptions: {
                            throw_operation_not_allowed_when_closed: assert_correct_throw_msg
                        }
                    });

                    let ado = new ADODBStream(this_context);
                    assert.throws(() => ado.position = 1);
                });
            });
        });

        xdescribe(".Type", () => {

            it("Should create a text stream", (done) => {

                let ado = new ADODBStream(context);
                assert.equal(ado.type, TEXT_STREAM);
                done();
            });

            it("Should allow changing stream types, only when .position is 0", (done) => {

                let ado = new ADODBStream(context);
                assert.equal(ado.type, TEXT_STREAM);
                ado.type = BINARY_STREAM;
                assert.equal(ado.type, BINARY_STREAM);
                done();
            });

            it("Should throw if trying to change types without position at 0", (done) => {

                function assert_correct_throw_msg () {
                    assert.isTrue(true);
                    done();
                }

                let this_context = {};
                Object.assign(this_context, context, {
                    exceptions: {
                        throw_operation_not_permitted_in_context: assert_correct_throw_msg
                    }
                });

                let ado = new ADODBStream(this_context);
                assert.equal(ado.type, TEXT_STREAM);

                ado.open();
                ado.WriteText("Hello, world!");
                assert.equal(ado.position, 26);

                try {
                    ado.type = BINARY_STREAM;
                }
                catch (e) {
                }

            });
        });
    });



    it("Should throw when trying to 'write' bytes in to a binary stream", (done) => {

        function assert_correct_throw_msg () {
            throw new Error("X");
            assert.isTrue(true);
        }

        let this_context = {};
        Object.assign(this_context, context, {
            exceptions: {
                throw_args_wrong_type_or_out_of_range_or_conflicted: assert_correct_throw_msg
            }
        });


        let ado = new ADODBStream(this_context);
        ado.type = BINARY_STREAM;
        ado.open();

        assert.throws(() => ado.write("abc"));

        done();
    });

});
