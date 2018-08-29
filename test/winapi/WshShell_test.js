const assert   = require("chai").assert,
      WshShell = require("../../src/winapi/WshShell"),
      make_ctx = require("../testlib");

const CONFIG = {
    environment: {
        whoami: "SomeUser",
        path: "C:\\Users\\Testing",
        variables: {
            system: {
                foo: "bar"
            }
        }
    }
};

var ctx = null;
function make_context (...args) {
    ctx = make_ctx(...args);
}

describe("WshShell", () => {

    beforeEach(function () {
        make_context({
            config: CONFIG
        });
    });

    describe("Construction", () => {

        it("should support creating a WshShell instance", () => {
            assert.doesNotThrow(() => new WshShell(ctx));
        });
    });

    describe("Properties", () => {

        describe(".SpecialFolders", () => {
            it("should return a WshSpecialFolders instance when accessing this property", () => {
                assert.doesNotThrow(() => new WshShell(ctx).specialfolders);
                assert.isString(new WshShell(ctx).SPECIALFOLDERS.item(0));
            });
        });

        describe(".CurrentDirectory", () => {

            it("should return the current directory path", () => {
                assert.equal(new WshShell(ctx).CurrentDirectory, CONFIG.environment.path);
            });

            it("should allow the CWD to be changed by assignment", () => {
                assert.equal(new WshShell(ctx).CurrentDirectory, CONFIG.environment.path);
                const new_cwd = "C:\\New\\CWD";
                ctx.vfs.AddFolder(new_cwd);
                assert.doesNotThrow(() => new WshShell(ctx).CurrentDirectory = new_cwd);
                assert.equal(new WshShell(ctx).CurrentDirectory, new_cwd);
            });

            it("should throw if the new CWD path does not exists or is invalid", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_winapi_exception: () => {
                            throw new Error("cannot set CWD");
                        }
                    }
                });

                assert.equal(new WshShell(ctx).CurrentDirectory, CONFIG.environment.path);
                const not_exists = "C:\\not\\exists";
                assert.isFalse(ctx.vfs.Exists(not_exists));
                assert.throws(() => new WshShell(ctx).CurrentDirectory = not_exists, "cannot set CWD");
                assert.throws(() => new WshShell(ctx).CurrentDirectory = "xxx",      "cannot set CWD");
                assert.throws(() => new WshShell(ctx).CurrentDirectory = "",         "cannot set CWD");
                assert.throws(() => new WshShell(ctx).CurrentDirectory = false,      "cannot set CWD");
            });
        });
    });

    describe("Methods", () => {

        describe("#Environment", () => {
            it("should return a WshEnvironment instance", () => {
                assert.doesNotThrow(() => new WshShell(ctx).Environment("SYSTEM"));
            });

            it("should throw if given an invalid environment type", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_invalid_fn_arg: () => {
                            throw new Error("invalid arg");
                        }
                    }
                });

                assert.throws(() => new WshShell(ctx).Environment("xxx"), "invalid arg");
                assert.throws(() => new WshShell(ctx).Environment("Foo"), "invalid arg");
                assert.throws(() => new WshShell(ctx).Environment("Bar"), "invalid arg");

                assert.throws(() => new WshShell(ctx).Environment(""), "invalid arg");
                assert.throws(() => new WshShell(ctx).Environment(null), "invalid arg");
                assert.throws(() => new WshShell(ctx).Environment(undefined), "invalid arg");


                assert.doesNotThrow(() => new WshShell(ctx).Environment("PROCESS"));
                assert.doesNotThrow(() => new WshShell(ctx).Environment("SYSTEM"));
                assert.doesNotThrow(() => new WshShell(ctx).Environment("USER"));
            });
        });
    });


});
