const assert            = require("chai").assert,
      VirtualFileSystem = require("../../src/runtime/virtfs"),
      WshEnvironment    = require("../../src/winapi/WshEnvironment"),
      make_ctx          = require("../testlib");

var ctx = null;
function make_context (...args) {
    ctx = make_ctx(...args);
}

describe("WshEnvironment", () => {

    beforeEach(function () {
        ctx = make_ctx({
            config: {
                environment: {
                    variables: {
                        system: {
                            foo: "bar"
                        },
                        process: {

                        }
                    }
                }
            }
        });
    });

    describe("Construction", () => {

        it("should return a WshEnvironment instance", () => {
            assert.doesNotThrow(() => new WshEnvironment(ctx, "process"));
            assert.doesNotThrow(() => new WshEnvironment(ctx, "system"));
            assert.doesNotThrow(() => new WshEnvironment(ctx, "user"));
        });

        it("should throw when given invalid collection types", () => {

            ctx = make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("Unknown env");
                    }
                }
            });

            assert.throws(() => new WshEnvironment(ctx, "xxx"),  "Unknown env");
            assert.throws(() => new WshEnvironment(ctx, "proc"), "Unknown env");
        });
    });

    describe("#Count", () => {

        it("should return the number of variables for the given environment collection", () => {
            assert.equal(new WshEnvironment(ctx, "system").count(), 1);
        });
    });
});
