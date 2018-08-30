const assert            = require("chai").assert,
      VirtualFileSystem = require("../../src/runtime/virtfs"),
      WshUnnamed        = require("../../src/winapi/WshUnnamed"),
      make_ctx          = require("../testlib");

var ctx = null;
function make_context (...args) {
    ctx = make_ctx(...args);
}

describe("WshUnnamed", () => {

    beforeEach(function () {
        ctx = make_ctx();
    });

    describe("Construction", () => {

        it("should return a WshUnnamed instance when no named args are given", () => {
            const unnamed = new WshUnnamed(ctx);
            assert.equal(unnamed.count, 0);
        });
    });

    describe(".Count", () => {

        it("should return zero when there are no args supplied", () => {
            assert.equal(new WshUnnamed(ctx).count, 0);
        });

        it("should return zero when the args object is empty", () => {
            let args = new WshUnnamed(ctx, []);
            assert.equal(args.count, 0);
        });

        it("should return the correct arg counts for unnamed args", () => {
            let args_unnamed = new WshUnnamed(ctx, ["foo", "baz"]);
            assert.equal(args_unnamed.count, 2);
        });
    });

    describe("#Item", () => {

        it("should throw a RangeError when requesting an out of bounds index", () => {

            make_context({
                exceptions: {
                    throw_range_error: () => {
                        throw new Error("range err");
                    }
                }
            });

            assert.doesNotThrow(() => new WshUnnamed(ctx, ["foo", "bar"]).item(0));
            assert.doesNotThrow(() => new WshUnnamed(ctx, ["foo", "bar"]).item(1));

            assert.throws(
                () => new WshUnnamed(ctx, ["foo", "bar"]).item(3), "range err"
            );

            assert.throws(() => new WshUnnamed(ctx).item(0),  "range err");
            assert.throws(() => new WshUnnamed(ctx).item(-1), "range err");
            assert.throws(() => new WshUnnamed(ctx).item(-5), "range err");
        });

        it("should throw if calling '.item()' with zero args", () => {

            make_context({
                exceptions: {
                    throw_unsupported_prop_or_method: () => {
                        throw new Error("no args");
                    }
                }
            });

            assert.throws(() => new WshUnnamed(ctx).item(), "no args");
        });

        it("should throw a type mismatch when null is passed to .item()", () => {

            make_context({
                exceptions: {
                    throw_type_mismatch: () => {
                        throw new Error("mismatch");
                    }
                }
            });

            assert.throws(() => new WshUnnamed(ctx).item(null), "mismatch");
        });

        it("should return the unnamed parameter when given its index", () => {

            const args = new WshUnnamed(ctx, ["foo", "bar", "baz"]);
            assert.equal(args.item(0), "foo");
            assert.equal(args.item(1), "bar");
            assert.equal(args.item(2), "baz");
        });
    });

    describe(".Length", () => {

        it("should return a length of zero when there are no unnamed args", () => {
            assert.equal(new WshUnnamed(ctx).length, 0);
        });

        it("should return the correct length for the number of unnamed args", () => {
            assert.equal(new WshUnnamed(ctx, ["foo"]).length, 1);
            assert.equal(new WshUnnamed(ctx, ["foo", "bar", "baz"]).length, 3);
            assert.equal(new WshUnnamed(ctx, [1, 2, 3, 4]).length, 4);
        });
    });
});
