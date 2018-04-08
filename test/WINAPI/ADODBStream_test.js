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

        describe(".type", () => {

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

                function assert_correct_throw_msg (source, summary) {
                    assert.isTrue(true);
                    // If this is called, then we threw the correct error.
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
