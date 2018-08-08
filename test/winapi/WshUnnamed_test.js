const assert            = require("chai").assert,
      VirtualFileSystem = require("../../src/runtime/virtfs"),
      WshUnnamed          = require("../../src/winapi/WshUnnamed");

var ctx = null;

function make_context (opts) {

    const NOOP = () => {};

    opts = opts || {};

    opts.exceptions  = opts.exceptions  || {};
    opts.environment = opts.environment || {};
    opts.config      = opts.config      || {};
    opts.streams     = opts.streams     || {};

    var default_env = {
        path: "C:\\Users\\Construct"
    };

    var default_cfg = {
        "autovivify": true
    };

    var default_streams = {
        stdin: NOOP,
        stdout: NOOP,
        stderr: NOOP
    };

    let env     = Object.assign({}, default_env,     opts.ENVIRONMENT),
        cfg     = Object.assign({}, default_cfg,     opts.config),
        streams = Object.assign({}, default_streams, opts.streams),
        epoch   = 1234567890;

    let context = {
        epoch: epoch,
        ENVIRONMENT: env,
        CONFIG: cfg,
        emitter: { emit: () => {} },
        exceptions: {},
        vfs: {},
        skew_time_ahead_by: (n) => { this.epoch++ },
        streams: streams,
        get_env: (e) => env[e],
        get_cfg: (c) => cfg[c]
    };

    let new_ctx = Object.assign({}, context, opts);

    let vfs = new VirtualFileSystem(new_ctx);
    new_ctx.vfs = vfs;

    // We set this just so code outside of this function can access
    // the created context object should it need to.
    ctx = new_ctx;

    vfs.AddFolder(ctx.get_env("path"));
}

describe("WshUnnamed", () => {

    beforeEach(function () {
        make_context();
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

        it("should return the correct arg counts for named args", () => {
            let args_named = new WshUnnamed(ctx, ["foo", "baz"]);
            assert.equal(args_named.count, 2);
        });
    });

    describe("#Item", () => {

        it("should return undefined when the named param does not exist", () => {
            assert.equal(new WshUnnamed(ctx).item("foo"), undefined);
            assert.equal(new WshUnnamed(ctx).item(""),    undefined);
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

        it("should return a length of zero when there are no named args", () => {
            assert.equal(new WshUnnamed(ctx).length, 0);
        });

        it("should return the correct length for the number of named args", () => {
            assert.equal(new WshUnnamed(ctx, {foo:"bar"}).length, 1);
            assert.equal(new WshUnnamed(ctx, {foo:"bar", bat: "baz"}).length, 2);
            assert.equal(new WshUnnamed(ctx, {
                foo:"bar",
                bat: "baz",
                "aaa": "bbb"
            }).length, 3);
        });
    });
});
