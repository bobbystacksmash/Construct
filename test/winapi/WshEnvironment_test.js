const assert            = require("chai").assert,
      VirtualFileSystem = require("../../src/runtime/virtfs"),
      WshEnvironment    = require("../../src/winapi/WshEnvironment"),
      make_ctx          = require("../testlib");

var ctx = null;
function make_context (...args) {
    ctx = make_ctx(...args);
}

const config = {
    environment: {
        variables: {
            system: {
                foo: "bar",
                HELLO: "WORLD",
                tmp: "C:\\Users\\Example\\AppData\\Local\\Temp"
            },
            process: {

            }
        }
    }
};

describe("WshEnvironment", () => {

    beforeEach(function () {
        ctx = make_ctx({ config: config });
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

        it("should allow case-insensitive access to properties", () => {
            const wshenv = new WshEnvironment(ctx, "system");
            assert.equal(wshenv.COUNT(), 3);
            assert.equal(wshenv.CoUNt(), 3);
        });
    });

    describe("#Count", () => {
        it("should return the number of variables for the given environment collection", () => {
            assert.equal(new WshEnvironment(ctx, "system").count(), 3);
        });
    });

    describe("#Item", () => {

        it("should return an item if it exists, ignoring case", () => {
            let env = new WshEnvironment(ctx, "system");

            assert.equal(env.item("foo"), "bar");
            assert.equal(env.item("Foo"), "bar");
            assert.equal(env.item("fOo"), "bar");
            assert.equal(env.item("fOO"), "bar");
            assert.equal(env.item("FOO"), "bar");
        });

        it("should return an empty string when the name cannot be found", () => {
            assert.equal(new WshEnvironment(ctx, "system").item("xxx"),  "");
            assert.equal(new WshEnvironment(ctx, "system").item("bar"),  "");
            assert.equal(new WshEnvironment(ctx, "system").item("BAZZ"), "");
        });

        it("should return an empty string if called with \"\"", () => {
            assert.equal(new WshEnvironment(ctx, "process").item(""), "");
        });

        it("should return an empty string if called with undefined", () => {
            assert.equal(new WshEnvironment(ctx, "process").item(undefined), "");
        });

        it("should throw a TypeError when called with incompatible types", () => {

            ctx = make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("invalid fn arg");
                    }
                },
                config: config
            });

            const incompat_types = [null];

            for (let i = 0; i < incompat_types.length; i++) {
                let wsh = new WshEnvironment(ctx, "process");
                assert.throws(() => wsh.item(incompat_types[i]), "invalid fn arg");
            }
        });
    });

    describe(".Length", () => {

        it("should report the length, the same as .Count()", () => {
            assert.equal(
                new WshEnvironment(ctx, "system").count(),
                new WshEnvironment(ctx, "system").length
             );
        });

        it("should throw an 'invalid property assignment' if .length is assigned to", () => {

            ctx = make_ctx({
                exceptions: {
                    throw_wrong_argc_or_invalid_prop_assign: () => {
                        throw new Error("no assignment");
                    }
                },
                config: config
            });

            const env = new WshEnvironment(ctx, "system");
            assert.throws(() => env.length = 4, "no assignment");
        });
    });

    describe(".Remove()", () => {

        it("should remove the named item from the collection", () => {

            const env = new WshEnvironment(ctx, "system");
            assert.equal(env.item("tmp"), "C:\\Users\\Example\\AppData\\Local\\Temp");
            assert.doesNotThrow(() => env.remove("tmp"));
            assert.equal(env.item("tmp"), "");
        });

        it("should throw a simple Error when trying to remove '' (empty string)", () => {

            ctx = make_ctx({
                exceptions: {
                    throw_cannot_remove_environment_var: () => {
                        throw new Error("cannot delete var");
                    }
                },
                config: config
            });

            const env = new WshEnvironment(ctx, "process");
            assert.throws(() => env.remove(""), "cannot delete var");
        });

        it("should not throw when deleting certain (non-string) types", () => {
            assert.doesNotThrow(() => new WshEnvironment(ctx, "process").remove(false));
            assert.doesNotThrow(() => new WshEnvironment(ctx, "process").remove(true));
        });
    });
});
