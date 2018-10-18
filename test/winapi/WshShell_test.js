const assert   = require("chai").assert,
      WshShell = require("../../src/winapi/WshShell"),
      make_ctx = require("../testlib");

const CONFIG = {
    environment: {
        whoami: "SomeUser",
        cwd: "C:\\Users\\Testing",
        variables: {
            system: {
                foo: "bar"
            },
            process: {
                baz: "test",
                hello: "world"
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

        it("should report the correct __name__", () => {
            assert.equal(new WshShell(ctx).__name__, "WshShell");
        });
    });

    describe("Properties", () => {

        describe(".CurrentDirectory", () => {

            it("should GET the current directory and return the path as a string", () => {
                assert.equal(new WshShell(ctx).currentdirectory, CONFIG.environment.cwd);
            });

            it("should SET the current directory, returning a string path to the new CWD", () => {
                const wsh     = new WshShell(ctx),
                      new_cwd = "C:\\Users";
                var cwd;
                assert.equal(wsh.currentdirectory, CONFIG.environment.cwd);
                assert.doesNotThrow(() => cwd = wsh.currentdirectory = new_cwd);
                assert.equal(cwd, new_cwd);
            });

            it("should throw if the new path does not exist", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_generic_winapi_exception: () => {
                            throw new Error("CWD not exists");
                        }
                    }
                });

                const wsh = new WshShell(ctx),
                      vfs = ctx.vfs;

                const not_exists_path = "C:\\path\\not\\found";
                assert.isFalse(vfs.Exists(not_exists_path));

                assert.throws(() => {
                    wsh.CurrentDirectory = not_exists_path;
                }, "CWD not exists");
            });

            it("should throw if the new path is an invalid Win path", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_generic_winapi_exception: () => {
                            throw new Error("Invalid CWD path");
                        }
                    }
                });

                // Testing this in a Win7 machine, there's no .message
                // or .description set in the thrown exception - just
                // these two props:
                //
                //   name Error
                //   number -2147024773
                //
                assert.throws(
                    () => new WshShell(ctx).currentdirectory = "|||||",
                    "Invalid CWD path"
                );
            });

            it("should support setting CWD to a path which contains a shortpath", () => {

                const vfs       = ctx.vfs,
                      shortpath = "C:\\HELLOW~1";

                vfs.AddFolder("C:\\HelloWorld");
                assert.isTrue(vfs.Exists("C:\\HelloWorld"), "fullpath exists");
                assert.isTrue(vfs.Exists(shortpath),        "shortpath exists");

                const wsh = new WshShell(ctx);
                var cwd = null;

                assert.doesNotThrow(() => wsh.CurrentDirectory = shortpath);
                assert.equal(wsh.CurrentDirectory, shortpath);
            });
        });

    });


    /*xdescribe("SpecialFolders", () => {
        describe("Property", () => {
            // The `SpecialFolders' attribute acts as both a property and
            // a method.
        });
    });

    xdescribe(".Environment", () => {

        // This property has odd behaviour, acting as both a function
        // and a property.  Two examples, both return a valid count:
        //
        //   - wsh.environment.count();
        //   - wsh.environment("PROCESS").count();
        //
        it("should support fetching .Environment via either prop or method", () => {

            const wsh = new WshShell(ctx);

            assert.doesNotThrow(() => wsh.environment.count());
            assert.doesNotThrow(() => wsh.environment("PROCESS").count());
            assert.equal(wsh.environment("PROCESS").count(), 2);
        });
    });

    xdescribe("Properties", () => {

        describe(".CurrentDirectory", () => {

            it("should return the current directory path", () => {
                assert.equal(new WshShell(ctx).CurrentDirectory, CONFIG.environment.cwd);
            });

            it("should allow the CWD to be changed by assignment", () => {
                assert.equal(new WshShell(ctx).CurrentDirectory, CONFIG.environment.cwd);
                const new_cwd = "C:\\New\\CWD";
                ctx.vfs.AddFolder(new_cwd);
                assert.doesNotThrow(() => new WshShell(ctx).CurrentDirectory = new_cwd);
                assert.equal(new WshShell(ctx).CurrentDirectory, new_cwd);
            });

            it("should throw if the new CWD path does not exist or is invalid", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_generic_winapi_exception: () => {
                            throw new Error("cannot set CWD");
                        }
                    }
                });

                assert.equal(new WshShell(ctx).CurrentDirectory, CONFIG.environment.cwd);
                const not_exists = "C:\\not\\exists";
                assert.isFalse(ctx.vfs.Exists(not_exists));
                assert.throws(() => new WshShell(ctx).CurrentDirectory = not_exists, "cannot set CWD");
                assert.throws(() => new WshShell(ctx).CurrentDirectory = "xxx",      "cannot set CWD");
                assert.throws(() => new WshShell(ctx).CurrentDirectory = "",         "cannot set CWD");
                assert.throws(() => new WshShell(ctx).CurrentDirectory = false,      "cannot set CWD");
            });
        });

        describe(".Environment", () => {

        });
    });

    xdescribe("Methods", () => {

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
    });*/
});
