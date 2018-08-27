const assert            = require("chai").assert,
      VirtualFileSystem = require("../../src/runtime/virtfs"),
      WshNamed          = require("../../src/winapi/WshNamed"),
      make_ctx          = require("../testlib");

var ctx = null;
function make_context (...args) {
    ctx = make_ctx(...args);
}

describe("WshNamed", () => {

    beforeEach(function () {
        ctx = make_ctx();
    });

    describe("Construction", () => {

        it("should return a WshNamed instance when no named args are given", () => {
            const named = new WshNamed(ctx);
            assert.equal(named.count, 0);
        });
    });

    describe(".Count", () => {

        it("should return zero when there are no args supplied", () => {
            assert.equal(new WshNamed(ctx).count, 0);
        });

        it("should return zero when the args object is empty", () => {
            let args = new WshNamed(ctx, {});
            assert.equal(args.count, 0);
        });

        it("should return the correct arg counts for named args", () => {

            let args_named = new WshNamed(ctx, {
                "foo": "bar",
                "baz": "b00"
            });
            assert.equal(args_named.count, 2);
        });
    });

    describe("#Exists", () => {

        it("should return the correct bool when testing if named arg exists", () => {

            let args = new WshNamed(ctx, {
                foo: "bar",
                baz: "yes"
            });

            assert.isTrue(args.exists("foo"));
            assert.isTrue(args.exists("FoO"));
            assert.isTrue(args.exists("FOO"));
            assert.isTrue(args.exists("BAZ"));

            assert.isFalse(args.exists("xxxx"));
        });

        it("should return FALSE when given an empty string", () => {
            assert.isFalse(new WshNamed(ctx).exists(""));
        });

        it("should return FALSE when given undefined", () => {
            assert.isFalse(new WshNamed(ctx).exists(undefined));
        });

        it("should throw a type mismatch exception when given null", () => {
            make_context({
                exceptions: {
                    throw_type_mismatch: () => {
                        throw new Error("type mismatch");
                    }
                }
            });

            assert.throws(() => new WshNamed(ctx).exists(null));
        });
    });

    describe("#Item", () => {

        it("should return undefined when the named param does not exist", () => {
            assert.equal(new WshNamed(ctx).item("foo"), undefined);
            assert.equal(new WshNamed(ctx).item(""),    undefined);
        });

        it("should throw if calling '.item()' with zero args", () => {

            make_context({
                exceptions: {
                    throw_unsupported_prop_or_method: () => {
                        throw new Error("no args");
                    }
                }
            });

            assert.throws(() => new WshNamed(ctx).item(), "no args");
        });

        it("should throw a type mismatch when null is passed to .item()", () => {

            make_context({
                exceptions: {
                    throw_type_mismatch: () => {
                        throw new Error("mismatch");
                    }
                }
            });

            assert.throws(() => new WshNamed(ctx).item(null), "mismatch");
        });

        it("should return the named parameter, regardless of case", () => {

            const args = new WshNamed(ctx, { foo: "bar" });
            assert.equal(args.item("foo"), "bar");
            assert.equal(args.item("Foo"), "bar");
            assert.equal(args.item("FOO"), "bar");
        });
    });

    describe(".Length", () => {

        it("should return a length of zero when there are no named args", () => {
            assert.equal(new WshNamed(ctx).length, 0);
        });

        it("should return the correct length for the number of named args", () => {
            assert.equal(new WshNamed(ctx, {foo:"bar"}).length, 1);
            assert.equal(new WshNamed(ctx, {foo:"bar", bat: "baz"}).length, 2);
            assert.equal(new WshNamed(ctx, {
                foo:"bar",
                bat: "baz",
                "aaa": "bbb"
            }).length, 3);
        });
    });
});
