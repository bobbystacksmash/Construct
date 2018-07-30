const assert          = require("chai").assert;
const VirtualRegistry = require("../../src/runtime/virtreg");

function make_vreg (opts) {

    opts = opts || {};

    opts.exceptions  = opts.exceptions  || {};
    opts.environment = opts.environment || {};
    opts.config      = opts.config      || {};

    var default_env = {
        path: "C:\\Users\\Construct"
    };

    var default_cfg = {
        "autovivify": true
    };


    let env   = Object.assign({}, default_env, opts.environment),
        cfg   = Object.assign({}, default_cfg, opts.config),
        epoch = opts.epoch || 1234567890;

    let context = {
        epoch: epoch,
        ENVIRONMENT: env,
        CONFIG: cfg,
        emitter: { emit: () => {} },
        get_env: (e) => env[e],
        get_cfg: (c) => cfg[c]
    };

    let new_ctx = Object.assign({}, context, opts);

    return new VirtualRegistry(new_ctx);
}

describe("Virtual Registry", () => {

    describe("#Write", () => {

        it("should allow keys to be written.", () => {
            const vreg = make_vreg(),
                  path = "HKEY_LOCAL_MACHINE\\foo\\bar\\key";

            assert.doesNotThrow(() => vreg.write(path, "value!"));
            assert.equal(vreg.read(path), "value!");
        });

        it("should allow keys to be overwritten", () => {

            const vreg = make_vreg(),
                  path = "HKEY_LOCAL_MACHINE\\aa\\bb\\foo";

            assert.doesNotThrow(() => vreg.write(path, "bar!"));
            assert.equal(vreg.read(path), "bar!");

            assert.doesNotThrow(() => vreg.write(path, "testing"));
            assert.equal(vreg.read(path), "testing");
        });

        it("should use 'HKLM' and 'HKEY_LOCAL_MACHINE' interchangeably", () => {

            const vreg1     = make_vreg(),
                  vreg2     = make_vreg(),
                  short_key = "HKLM\\aa\\bb\\foo",
                  long_key  = "HKEY_LOCAL_MACHINE\\aa\\bb\\foo";

            // write(HKLM) -> read(HKEY_LOCAL_MACHINE)
            vreg1.write(short_key, "Hello, World!");
            assert.equal(vreg1.read(long_key), "Hello, World!");

            // write(HKEY_LOCAL_MACHINE) -> read(HKLM)
            vreg2.write(long_key, "Hello, World!");
            assert.equal(vreg2.read(short_key), "Hello, World!");
        });

        it("should ignore case differences between paths", () => {

            const vreg = make_vreg(),
                  path = "HKEY_LOCAL_MACHINE\\aa\\bb\\foo";

            vreg.write(path.toUpperCase(), "UPPER CASE");
            assert.equal(vreg.read(path.toLowerCase()), "UPPER CASE");
        });

        it("should write a default value a path ends with a backslash", () => {

            const vreg = make_vreg(),
                  path = "HKLM\\aa\\bb\\foo\\";

            vreg.write(path, "this is the default");
            assert.equal(vreg.read(path), "this is the default");
        });

        it("should throw 'invalid root' when trying to write an unknown root", () => {
            // TODO
        });

        // TODO: what about paths which don't yet exist - are they auto-vivified?

    });

    describe("#Read", () => {

        it("should read the default value if the path ends in a backslash", () => {
            const vreg = make_vreg();
            // todo
        });

        it("should return the default value for a key which exists", () => {
            const vreg = make_vreg(),
                  path = "HKEY_LOCAL_MACHINE\\System\\CurrentControlSet\\Hello\\";
            vreg.write(path, "World!");
            assert.equal(vreg.read(path), "World!");
        });

        it("should throw 'invalid root' when trying to read an unknown root", () => {
            const vreg = make_vreg();
            assert.throws(() => vreg.read("FOOBAR\\baz"), "Invalid root: FOOBAR");
        });

        it("should throw when unable to open an non-existant registry key", () => {

            const vreg = make_vreg(),
                  path = "HKEY_LOCAL_MACHINE\\aa\\bb\\cc";

            assert.throws(
                () => vreg.read(path),
                `Unable to open registry key - path not found: ${path}`
            );
        });
    });

    describe("#Delete", () => {

        it("should delete an existing key.", () => {
            const vreg = make_vreg(),
                  path = "HKLM\\foo\\bar\\baz";

            vreg.write(path, "hello world");
            assert.equal(vreg.read(path), "hello world");

            assert.doesNotThrow(vreg.delete(path));
        });


        it("should delete the default value if ending in a trailing slash", () => {});
        it("shuold throw when trying to delete a path from an unknown root", () => {});

    });
});
