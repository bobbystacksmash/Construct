const assert            = require("chai").assert,
      VirtualFileSystem = require("../../src/runtime/virtfs"),
      WshArguments      = require("../../src/winapi/WshArguments"),
      make_ctx          = require("../testlib");

var ctx = null;
function make_context (...args) {
    ctx = make_ctx(...args);
}

describe("WshArguments", () => {

    beforeEach(function () {
        ctx = make_ctx();
    });

    describe("Construction", () => {

        it("should not throw when creating an instance of WshArguments", () => {
            assert.doesNotThrow(() => new WshArguments(ctx));
        });

        it("should not throw when given empty args", () => {
            assert.doesNotThrow(() => new WshArguments(ctx, []));
        });
    });

    describe(".Length", () => {

        it("should return zero when there are no args supplied", () => {
            assert.equal(new WshArguments(ctx).length, 0);
        });

        it("should throw if attempting to assign to .length", () => {
            make_context({
                exceptions: {
                    throw_wrong_argc_or_invalid_prop_assign: () => {
                        throw new Error("readonly prop");
                    }
                }
            });

            assert.throws(
                () => new WshArguments(ctx, ["foo"]).length = 2,
                "readonly prop"
            );
        });

        it("should return zero when the args object(s) are empty", () => {
            let args = new WshArguments(ctx, []);
            assert.equal(args.length, 0);

            args = new WshArguments(ctx, []);
            assert.equal(args.length, 0);
        });

        it("should return the correct arg counts for named and unnamed args", () => {

            let args_named = new WshArguments(ctx, [
                { foo: "bar" },
                { baz: "b00" },
            ]);
            assert.equal(args_named.length, 2);

            let args_unnamed = new WshArguments(ctx, [
                "foo",
                "bar",
                "b0rk"
            ]);
            assert.equal(args_unnamed.length, 3);

            let args_combined = new WshArguments(ctx, [
                "foo", "bar", "baz",
                { foo: "b0x" },
                { baz: "bar" }
            ]);

            assert.equal(args_combined.length, 5);
        });
    });

    describe("#Item", () => {

        it("should return the correct item when passing a number", () => {
            const args = new WshArguments(ctx, ["zero", "one", {foo: "BAR"}]);
            assert.equal(args.item(0), "zero");
            assert.equal(args.item(1), "one");
            assert.equal(args.item(2), "/foo:BAR");
        });

        it("should return an item when the index is a numeric string", () => {
            const args = new WshArguments(ctx, ["zero", "one", {foo: "BAR"}]);

            assert.equal(args.item("0"), "zero");
            assert.equal(args.item("1"), "one");
            assert.equal(args.item("2"), "/foo:BAR");
        });

        it("should throw 'subscript out of range' when the index is OOB", () => {

            make_context({
                exceptions: {
                    throw_subscript_out_of_range: () => {
                        throw new Error("range err");
                    }
                }
            });

            const args = new WshArguments(ctx, ["zero", "one"]);
            assert.throws(() => args.item(2), "range err");
        });

        it("should throw when no arg is given to .item", () => {
            make_context({
                exceptions: {
                    throw_wrong_argc_or_invalid_prop_assign: () => {
                        throw new Error("no arg for item");
                    }
                }
            });

            const args = new WshArguments(ctx, ["zero"]);
            assert.throws(() => args.item(), "no arg for item");
        });

        it("should return the first item if .item() is given 'undefined'", () => {
            assert.equal(new WshArguments(ctx, ["zero"]).item(undefined), "zero");
        });

        it("should throw a type error when given 'null'", () => {
            make_context({
                exceptions: {
                    throw_type_error: () => {
                        throw new Error("null throws");
                    }
                }
            });

            assert.throws(() => new WshArguments(ctx).item(null), "null throws");
        });
    });

    describe(".Named", () => {

        it("should return zero when no named args are given", () => {
            assert.equal(new WshArguments(ctx).named.count, 0);
        });

        it("should return the correct count of named args", () => {
            assert.equal(new WshArguments(ctx, [{foo: "bar"}]).named.count, 1);
        });

        it("should return zero when named params are not present", () => {
            assert.equal(new WshArguments(ctx, ["foo", "bar"]).named.count, 0);
        });
    });

    describe(".Unnamed", () => {

        it("should return zero when no unnamed args are given", () => {
            assert.equal(new WshArguments(ctx).unnamed.count, 0);
        });

        it("should return the correct count of unnamed args", () => {
            assert.equal(new WshArguments(ctx, ["aaa", "bbb"]).unnamed.count, 2);
        });

        it("should return zero when unnamed params are not present", () => {
            assert.equal(new WshArguments(ctx, [{foo: "bar"}]).unnamed.count, 0);
        });
    });

    describe(".Count()", () => {

        it("should return the correct number of supplied arguments", () => {

            const args = new WshArguments(ctx, [
                "one", "two",
                { three: "x", four: "x" },
                "five"
            ]);

            assert.equal(args.count(), 5);
        });

        it("should return zero when there are no arguments", () => {
            assert.equal(new WshArguments(ctx).count(), 0);
        });
    });
});
