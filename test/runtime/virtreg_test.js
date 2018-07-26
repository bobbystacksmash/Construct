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
                  key  = "HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\foo";

            assert.doesNotThrow(() => vreg.write(key, "bar!"));
            assert.equal(vreg.read(key), "bar!");
        });

        xit("should create the whole path without needing to create each key along the way", () => {
            // mkdir -p
        });
    });

    xdescribe("#Read", () => {

        xit("should ignore case when reading paths", () => {});

        xit("should return the default value for a key which exists", () => {
            const vreg = make_vreg();
            vreg.wrte("HKEY_LOCAL_MACHINE\\System\\CurrentControlSet\\Hello", "hello world");
        });
    });
});
