const assert   = require("chai").assert,
      WshShell = require("../../src/winapi/WshShell"),
      make_ctx = require("../testlib");

const CONFIG = {
    general: {
        whoami: "SomeUser"
    },
    environment: {
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

        describe(".Environment", () => {

            // WshShell.Environment returns a WshEnvironment collection.
            // See `WshEnvironment_test.js` for tests specific to this
            // class.
            //
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

                assert.doesNotThrow(() => wsh.environment("SYSTEM").count());
                assert.equal(wsh.environment("SYSTEM").count(), 1);
            });
        });

        describe(".SpecialFolders", () => {

            // WshShell.SpecialFolders returns a WshSpecialFolders
            // collection.  See `WshSpecialFolders_test.js` for tests
            // specific to this class.
            //
            // This property has odd behaviour, acting as both a function
            // and a property.  Two examples, both return a valid count:
            //
            //   - wsh.specialfolders.count();
            //   - wsh.specialfolders("PROCESS").count();
            //

            it("should inherit the WshShell source type when throwing", (done) => {
                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_unsupported_prop_or_method: (source, summary, desc) => {
                            assert.equal(source, "WshShell");
                            done();
                        }
                    }
                });

                new WshShell(ctx).SpecialFolders();
            });

            it("should throw if called as a method without any args", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_unsupported_prop_or_method: () => {
                            throw new Error("no prop or method");
                        }
                    }
                });

                const wsh = new WshShell(ctx);
                assert.throws(() => wsh.SpecialFolders(), "no prop or method");

                assert.doesNotThrow(() => wsh.SpecialFolders);
                assert.doesNotThrow(() => wsh.SpecialFolders.item("Desktop"));
                assert.equal(wsh.SpecialFolders.item("Desktop"), "C:\\Users\\SomeUser\\Desktop");
            });

            it("should support fetching .SpecialFolders via either prop or method", () => {

                const wsh = new WshShell(ctx);

                assert.doesNotThrow(() => wsh.SpecialFolders.count());

                // PROPERTY
                assert.doesNotThrow(() => wsh.SpecialFolders);
                assert.equal(wsh.SpecialFolders.item(0), "C:\\Users\\Public\\Desktop");

                // METHOD + ARG
                assert.doesNotThrow(() => wsh.SpecialFolders("Desktop"));
                assert.equal(wsh.SpecialFolders("Desktop"), "C:\\Users\\SomeUser\\Desktop");
            });

            it("should return the dirpath when called as a method", () => {

                const wsh = new WshShell(ctx);

                assert.equal(wsh.SpecialFolders("Desktop"), "C:\\Users\\SomeUser\\Desktop");
                assert.equal(wsh.SpecialFolders(0), "C:\\Users\\Public\\Desktop");
            });
        });
    });

    describe("Methods", () => {

        describe("#AppActivate", () => {

            it("should throw if too few params are given", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("no args");
                        }
                    }
                });

                const wsh = new WshShell(ctx);
                assert.throws(() => wsh.AppActivate(), "no args");
            });

            it("should return a boolean if AppActivate was a success", () => {
                const wsh = new WshShell(ctx);
                assert.isFalse(wsh.AppActivate("Emacs"));
            });
        });
    });
});
