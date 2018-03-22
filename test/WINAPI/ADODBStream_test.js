const assert = require("chai").assert;
const JS_ADODBStream = require("../../src/winapi/ADODBStream");

let mock_context = {
    epoch: 123456,
    emitter: {
        on: () => {},
        emit: () => {}
    }
};

describe("ADODBStream", () => {

    describe("PROPERTIES", () => {

        describe(".type", () => {

            describe("SET", () => {

                xit("Should throw if the type is not '1' or '2'", (done) => {

                    let context = Object.assign({}, mock_context, {
                        exceptions: {
                            throw_args_wrong_type_or_out_of_range_or_conflicted: (type) => {
                                throw new Error(`OBJ THREW: ${type}`);
                            }
                        }
                    });

                    let stream = new JS_ADODBStream(context);
                    function chuckA () { stream.type = 0; };

                    assert.throws(chuckA, "OBJ THREW");
                    done();

                });

                it("Should throw if type is 'binary' and 'writetext' is used.", (done) => {

                    let context = Object.assign({}, mock_context, {
                        exceptions: {
                            throw_operation_not_permitted_in_context: (type) => {
                                throw new Error(`OBJ THREW: ${type}`);
                            }
                        }
                    });

                    let stream = new JS_ADODBStream(context);
                    stream.open();
                    stream.type = 1;
                    function chuck () { stream.writetext("testing"); }
                    assert.throws(chuck, "OBJ THREW");
                    done();
                });

                it("Should throw if type is 'text' and 'write' is used.", (done) => {

                    let context = Object.assign({}, mock_context, {
                        exceptions: {
                            throw_operation_not_permitted_in_context: (type) => {
                                throw new Error(`OBJ THREW: ${type}`);
                            }
                        }
                    });

                    let stream = new JS_ADODBStream(context);
                    stream.open();
                    stream.type = 2;
                    function chuck () { stream.write("testing"); }

                    assert.throws(chuck, "OBJ THREW");
                    done();
                });
            });
        });

        // X'd out until a new method for writing to the stream is used.
        // Using `write' is not possible.
        xdescribe(".position", () => {

            describe("GET", () => {

            });

            describe("SET", () => {

                it("Should increase the size of the buffer if position is longer than buf.len", (done) => {

                    let stream = new JS_ADODBStream(mock_context);
                    stream.open();
                    stream.write([ 0xBA, 0xAD, 0xC0, 0xFF, 0xEE ]);
                    assert.equal(stream.size, 5);

                    stream.position = 10;
                    assert.equal(stream.size, 10);
                    assert.equal(stream.position, 10);

                    assert.deepEqual(stream.read(), [0xBA, 0xAD, 0xC0, 0xFF, 0xEE, 0, 0, 0, 0, 0]);

                    done();
                });
            });
        });



        describe(".size", () => {

            it("Should throw when size is requested on an unopen stream", (done) => {

                let context = Object.assign({}, mock_context, {
                    exceptions: {
                        throw_operation_not_allowed_when_closed: (type) => {
                            throw new Error(`OBJ THREW: ${type}`);
                        }
                    }
                });

                let stream = new JS_ADODBStream(context);
                function chuck () { return stream.size; /* this should throw */ }

                assert.throws(chuck, "OBJ THREW: ADODB.Stream");
                done();
            });
        });
    });

    xdescribe("METHODS", () => {
        describe("#Open", () => {

            it("Should open a new Stream when Open is called.", (done) => {

                let context = Object.assign({}, mock_context, {
                    emitter: {
                        emit: (event) => {
                            if (event === "@ADODBStream::Open") {
                                assert.equal(true, true);
                                done();
                            }
                        }
                    }
                });

                let stream = new JS_ADODBStream(context);
                stream.open();
            });

            it("Should throw an exception when Open is called on an already open obj.", (done) => {

                let context = Object.assign({}, mock_context, {
                    exceptions: {
                        throw_not_allowed: (source) => {
                            throw new Error("msg");
                        }
                    }
                });

                let stream = new JS_ADODBStream(context);
                assert.doesNotThrow(stream.open);
                assert.throws(stream.open, Error);
                done();
            });
        });


        xdescribe("#WriteText", () => {

            it("Should throw when trying to write to an unopened stream.", (done) => {

                let context = Object.assign({}, mock_context, {
                    exceptions: {
                        throw_operation_not_allowed_when_closed: (type) => {
                            throw new Error(`OBJ THREW: ${type}`);
                        }
                    }
                });

                let stream = new JS_ADODBStream(context);
                stream.type = 2;

                var write = function () { stream.writetext("Foo bar."); };
                assert.throws(write, "OBJ THREW: ADODB.Stream");
                done();
            });


            it("Should report a length of '2' when an empty string is written", (done) => {
                let stream = new JS_ADODBStream(mock_context);
                stream.type = 2;
                stream.open();
                assert.equal(stream.size, 0);
                stream.writetext("");
                assert.equal(stream.size, 2);
                done();
            });

            it("Should not throw when trying to write to an open stream.", (done) => {

                let stream = new JS_ADODBStream(mock_context);
                stream.type = 2;

                var write = function () { stream.writetext("Foo bar."); };
                assert.throws(write);
                done();
            });


            /*it("Should allow text to be written to an open text stream.", (done) => {

             let stream = new JS_ADODBStream(mock_context);
             stream.type = 2;
             stream.writetext("Foo bar.");
             assert.equal(stream.size,
             });*/
        });


        xdescribe("#Write", () => {

            // Doesn't work! You can't #Write() bytes directly in.  You
            // need to "side-load" bytes from a file on disk.
            //
            // TODO!

            it("Should allow bytes to be written to the stream.", (done) => {

                let stream = new JS_ADODBStream(mock_context);
                stream.open();
                stream.write([ 0xBA, 0xAD, 0xC0, 0xFF, 0xEE ]);
                assert.equal(stream.size, 5);
                done();
            });


            it("Should allow more bytes to be written to an existing buffer.", (done) => {

                let stream = new JS_ADODBStream(mock_context);
                stream.open();
                stream.write([ 0xBA, 0xAD, 0xC0, 0xFF, 0xEE ]);
                stream.write([ 0xDE, 0xAD, 0xBE, 0xEF       ]);

                assert.equal(stream.size, 9);
                assert.deepEqual(stream.read(stream.size), [
                    0xBA, 0xAD, 0xC0, 0xFF, 0xEE,
                    0xDE, 0xAD, 0xBE, 0xEF
                ]);

                done();
            });
        });

        // TODO: Need to fix how 'write' is used here.  Probably text instead of bytes.
        xdescribe("#CopyTo", () => {

            it("Should copy bytes from one stream to another.", (done) => {

                let stream_one = new JS_ADODBStream(mock_context),
                    stream_two = new JS_ADODBStream(mock_context);

                stream_one.open();
                stream_two.open();

                stream_one.write([ 10, 20, 30, 40 ]);
                stream_two.write([ 50, 60, 70, 80 ]);

                stream_one.position = 0;
                stream_one.copyto(stream_two);

                stream_two.position = 0;
                assert.deepEqual(stream_two.read(), [ 50, 60, 70, 80, 10, 20, 30, 40 ]);

                done();
            });

            // throw of stream is not open
            //

        });

        // TODO: Fix #Write, which is breaking all of these tests.
        xdescribe("#SetEOS", () => {

            it("Should lose all data AFTER EOS once set.", (done) => {

                let stream = new JS_ADODBStream(mock_context);
                stream.open();
                stream.write([ 0xBA, 0xAD, 0xC0, 0xFF, 0xEE ]);
                assert.equal(stream.size, 5);

                stream.setEOS(3);

                assert.deepEqual(stream.read(stream.size), [0xBA, 0xAD, 0xC0]);
                assert.equal(stream.size, 3);

                done();
            });


            it("Should truncate as expected.", (done) => {

                let stream = new JS_ADODBStream(mock_context);
                stream.open();
                stream.write([ 0xBA, 0xAD, 0xC0, 0xFF, 0xEE ]);
                assert.equal(stream.size, 5);

                stream.setEOS(2);

                stream.write([ 0xBE, 0xEF  ]);

                assert.equal(stream.size, 4);
                assert.deepEqual(stream.read(stream.size), [
                    0xBA, 0xAD, 0xBE, 0xEF
                ]);

                done();
            });
        });
    });

});
