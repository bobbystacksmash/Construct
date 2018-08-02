const assert            = require("chai").assert,
      VirtualFileSystem = require("../../src/runtime/virtfs"),
      WshShortcut       = require("../../src/winapi/WshShortcut");

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

describe("WshShortcut", () => {

    beforeEach(function () {
        make_context();
    });

    describe("Construction", () => {

        it("should have a .toString() set to the LNK path when called", () => {
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");
            assert.equal(wsh.toString(), "C:\\foo.lnk");
        });

        it("should create a lnk in memory, but not persist it to disk", () => {
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");
            assert.equal(wsh.toString(), "C:\\foo.lnk");
            assert.isFalse(ctx.vfs.Exists("C:\\foo.lnk"));
        });

        it("should get the arguments from an existing LNK instance", () => {

            ctx.vfs.AddFile("C:\\foo.lnk", JSON.stringify({
                _arguments: "file args",
                _description: "file desc",
                _fullname: "file fullname",
                _targetpath: "file target path"
            }));

            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");
            assert.equal(wsh.arguments, "file args");
        });
    });

    describe(".Arguments", () => {

        it("should return an empty string when there are no arguments", () => {
            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.arguments, "");
        });

        it("should return the new value when setting the property", () => {

            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.arguments, "");
            const new_location = wsh.arguments = "foobarbaz";
            assert.equal(new_location, wsh.arguments);
        });

        it("should get and set arguments when no backing file is available", () => {

            assert.isFalse(ctx.vfs.Exists("C:\\foo.lnk"));
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");

            assert.equal(wsh.arguments, "");

            assert.doesNotThrow(() => wsh.arguments = "args...");
            assert.equal(wsh.arguments, "args...");

            assert.doesNotThrow(() => wsh.arguments = "new args!");
            assert.equal(wsh.arguments, "new args!");
        });
    });

    describe(".Description", () => {

        it("should return an empty string when there's no description", () => {
            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.description, "");
        });

        it("should return the new value when setting the property", () => {

            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.description, "");
            const new_location = wsh.description = "foobarbaz";
            assert.equal(new_location, wsh.description);
        });

        it("should get and set the description when no backing file is available", () => {

            assert.isFalse(ctx.vfs.Exists("C:\\foo.lnk"));
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");

            assert.equal(wsh.description, "");

            assert.doesNotThrow(() => wsh.description = "desc...");
            assert.equal(wsh.description, "desc...");

            assert.doesNotThrow(() => wsh.description = "new desc!");
            assert.equal(wsh.description, "new desc!");
        });
    });

    describe(".FullName", () => {

        it("should return a full path to the shortcut file", () => {

            const path = "C:\\default.lnk",
                  wsh  = new WshShortcut(ctx, path);

            assert.equal(wsh.FullName, path);
        });

        it("should throw when trying to assign to '.FullName'", () => {

            make_context({
                exceptions: {
                    throw_wrong_argc_or_invalid_prop_assign: () => {
                        throw new Error("cannot assign to .fullname");
                    }
                }
            });

            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.throws(() => wsh.FullName = "C:\\foo.lnk", "cannot assign to .fullname");
        });
    });

    describe(".HotKey", () => {

        it("should return an empty string when there are no arguments", () => {
            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.hotkey, "");
        });

        it("should return the new value when setting the property", () => {

            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.hotkey, "");
            const new_location = wsh.hotkey = "foobarbaz";
            assert.equal(new_location, wsh.hotkey);
        });

        it("should get and set arguments when no backing file is available", () => {

            assert.isFalse(ctx.vfs.Exists("C:\\foo.lnk"));
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");

            assert.equal(wsh.hotkey, "");

            assert.doesNotThrow(() => wsh.hotkey = "hotkey...");
            assert.equal(wsh.hotkey, "hotkey...");

            assert.doesNotThrow(() => wsh.hotkey = "new hotkey!");
            assert.equal(wsh.hotkey, "new hotkey!");
        });
    });


    describe(".IconLocation", () => {

        it("should return ',0' by default", () => {
            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.iconlocation, ",0");
        });

        it("should return the new value when setting the property", () => {

            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.iconlocation, ",0");
            const new_location = wsh.iconlocation = "foobarbaz";
            assert.equal(new_location, wsh.iconlocation);
        });

        it("should get and set the icon location when no backing file is available", () => {

            assert.isFalse(ctx.vfs.Exists("C:\\foo.lnk"));
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");

            assert.equal(wsh.iconlocation, ",0");

            assert.doesNotThrow(() => wsh.iconlocation = "icon...");
            assert.equal(wsh.iconlocation, "icon...");

            assert.doesNotThrow(() => wsh.iconlocation = "new icon!");
            assert.equal(wsh.iconlocation, "new icon!");
        });
    });




    xdescribe("#Save", () => {

        // TODO: should save a blank .lnk when nothing is written and
        // .Save() is called.

    });
});
