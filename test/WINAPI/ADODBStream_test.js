const assert = require("chai").assert;
const ADODBStream = require("../../src/winapi/ADODBStream");

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

        describe(".LineSeparator", () => {

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

        describe(".EOS", () => {

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

});
