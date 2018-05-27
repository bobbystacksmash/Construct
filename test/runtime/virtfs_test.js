const assert = require("chai").assert;
const VirtualFileSystem = require("../../src/runtime/virtfs");

function make_vfs (opts) {

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

    return new VirtualFileSystem(new_ctx);
}

describe("Virtual File System", () => {

    describe("Environment variables", () => {

        it("should correctly expand environment variables", () => {

            let vfs = make_vfs({
                environment: {
                    foo: "FOO!",
                    bar: "BAR!",
                    baz: "BAZ!"
                }
            });

            let tests = [
                {
                    input: "Hello %foo% bar %BaR% %baz %BAZ% world...",
                    output: "Hello FOO! bar BAR! %baz BAZ! world..."
                },
                {
                    input:  " %FOO% %foo% %Foo% %fOO% ",
                    output: " FOO! FOO! FOO! FOO! "
                }
            ];

            tests.forEach(t => assert.equal(vfs.ExpandEnvironmentStrings(t.input), t.output));

        });
    });

    xdescribe("Paths", () => {

        it("should identify absolute paths", () => {

            let vfs = make_vfs();

            const list_of_abs_paths = [
                "\\\\?\\C:\\foo\\bar.txt",
                "\\\\unc",
                "C:\\foo.txt",
                "C:\\bar\\baz.txt"
            ];

            list_of_abs_paths.forEach(
                p => assert.isTrue(vfs.PathIsAbsolute(p))
            );
        });

        it("should identify relative paths", () => {

            let vfs = make_vfs();

            const list_of_rel_paths = [
                "C:foo.txt",
                "d:..\bar.txt",
                "..\foo\bar.txt",
                "foo.txt",
                "..\\bar/baz.txt",
                "..\..\..\..\a.txt"
            ];

            list_of_rel_paths.forEach(
                p => assert.isTrue(vfs.PathIsRelative(p))
            );
        });

        // Path Expansion

        // .TODO
        // Path expansion tests need to be written.  This is
        // blocked on getting the wildcarding code working.
        // .TODO

        // Path Resolution
        // - env vars
        // -

    });


});
