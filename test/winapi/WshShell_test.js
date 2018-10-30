const assert      = require("chai").assert,
      WshShell    = require("../../src/winapi/WshShell"),
      WshShortcut = require("../../src/winapi/WshShortcut"),
      make_ctx    = require("../testlib");

const CONFIG = {
    general: {
        whoami: "SomeUser"
    },
    environment: {
        cwd: "C:\\Users\\Testing",
        variables: {
            system: {
                TEMP: "C:\\Users\\SomeUser\\AppData\\Local\\Temp",
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

            it("should GET the CWD and return the path as a string", () => {
                assert.equal(
		    new WshShell(ctx).currentdirectory,
		    CONFIG.environment.cwd
		);
            });

            it("should SET the CWD, returning a string path to the new CWD", () => {
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

            it("should support setting CWD to a shortpath", () => {

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
            it("should support fetching .Environment via prop or method", () => {

                const wsh = new WshShell(ctx);

                assert.doesNotThrow(() => wsh.environment.count());
                assert.doesNotThrow(() => wsh.environment("PROCESS").count());
                assert.isNumber(wsh.environment("PROCESS").count());

                assert.doesNotThrow(() => wsh.environment("SYSTEM").count());
                assert.isNumber(wsh.environment("SYSTEM").count());
            });

            it("should throw a 'TypeError' when attempting to assign to .Env", () => {
                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_unsupported_prop_or_method: () => {
                            throw new Error("cannot assign to this prop");
                        }
                    }
                });

                const wsh = new WshShell(ctx);
                assert.throws(() => wsh.Environment = 6, "cannot assign to this prop");
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
                assert.equal(
		    wsh.SpecialFolders.item("Desktop"),
		    "C:\\Users\\SomeUser\\Desktop"
		);
            });

            it("should support fetching .SpecialFolders via prop or method", () => {

                const wsh = new WshShell(ctx);

                assert.doesNotThrow(() => wsh.SpecialFolders.count());

                // PROPERTY
                assert.doesNotThrow(() => wsh.SpecialFolders);
                assert.equal(
		    wsh.SpecialFolders.item(0),
		    "C:\\Users\\Public\\Desktop"
		);

                // METHOD + ARG
                assert.doesNotThrow(() => wsh.SpecialFolders("Desktop"));
                assert.equal(
		    wsh.SpecialFolders("Desktop"),
		    "C:\\Users\\SomeUser\\Desktop"
		);
            });

            it("should return the dirpath when called as a method", () => {

                const wsh = new WshShell(ctx);

                assert.equal(
		    wsh.SpecialFolders("Desktop"),
		    "C:\\Users\\SomeUser\\Desktop"
		);

                assert.equal(wsh.SpecialFolders(0), "C:\\Users\\Public\\Desktop");
            });

            it("should throw a 'TypeError' when attempting to assign to .Env", () => {
                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_unsupported_prop_or_method: () => {
                            throw new Error("cannot assign to this prop");
                        }
                    }
                });

                const wsh = new WshShell(ctx);
                assert.throws(() => wsh.SpecialFolders = 6, "cannot assign to this prop");
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

        describe("#CreateShortcut", () => {

            it("should throw when pathspec doesn't end with .lnk or .url", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_subscript_out_of_range: () => {
                            throw new Error("path doesn't end with .lnk or .url");
                        }
                    }
                });

                assert.throws(
                    () => new WshShell(ctx).CreateShortcut("./shortcutlnk"),
                    "path doesn't end with .lnk or .url"
                );

                assert.throws(
                    () => new WshShell(ctx).CreateShortcut(""),
                    "path doesn't end with .lnk or .url"
                );

                assert.throws(
                    () => new WshShell(ctx).CreateShortcut(true),
                    "path doesn't end with .lnk or .url"
                );

                assert.throws(
                    () => new WshShell(ctx).CreateShortcut(false),
                    "path doesn't end with .lnk or .url"
                );

                assert.throws(
                    () => new WshShell(ctx).CreateShortcut(undefined),
                    "path doesn't end with .lnk or .url"
                );
            });

            it("should return a WshShortcut instance", () => {

                assert.isFalse(ctx.vfs.FileExists("C:\\shortcut.lnk"));
                var sc = null;
                assert.doesNotThrow(
		    () =>
			sc = (new WshShell(ctx)).CreateShortcut("C:\\shortcut.lnk")
		);
                assert.equal(sc.__name__, "WshShortcut");
            });

            it("should return an existing WshShortcut instance if exists", () => {
                assert.isFalse(ctx.vfs.FileExists("C:\\shortcut.lnk"));
                var sc = new WshShortcut(ctx, "C:\\shortcut.lnk");
                sc.TargetPath = "C:\\Windows";
                sc.save();
                assert.isTrue(ctx.vfs.FileExists("C:\\shortcut.lnk"));

                sc = null;

                const wsh = new WshShell(ctx);
                assert.doesNotThrow(
		    () => sc = wsh.CreateShortcut("C:\\shortcut.lnk")
		);
                assert.equal(sc.targetpath, "C:\\Windows");
            });
        });

        describe("#Exec", () => {
            it("should return a WshScriptExec instance when called", () => {
                const wsh = new WshShell(ctx);
                assert.equal(wsh.exec("cmd").__name__, "WshScriptExec");
            });
        });

        describe("#ExpandEnvironmentStrings", () => {

            it("should expand an environment variable", () => {
                assert.equal(
                    new WshShell(ctx).ExpandEnvironmentStrings("%TEMP%"),
                    CONFIG.environment.variables.system.TEMP
                );
            });

            it("should expand an envvar, ignoring case", () => {

                ["temp", "TEMP", "Temp", "tEmp", "teMp", "temP",
                 "TEmp", "TEMp"].forEach(t => {
                     assert.equal(
                         new WshShell(ctx).ExpandEnvironmentStrings(`%${t}%`),
                         CONFIG.environment.variables.system.TEMP
                     );
                 });
            });

            it("should not replace variables which are not between '%'", () => {
                assert.equal(
                    new WshShell(ctx).ExpandEnvironmentStrings("temp"),
                    "temp"
                );

                assert.equal(
                    new WshShell(ctx).ExpandEnvironmentStrings("temp%"),
                    "temp%"
                );

                assert.equal(
                    new WshShell(ctx).ExpandEnvironmentStrings("%temp"),
                    "%temp"
                );
            });

            it("should replace envvars anywhere inside a string", () => {

                const inputs = {
                    "Hello %foo% world": "Hello bar world",
                    "Read from %foo%": "Read from bar",
                    "%foo% %foo% %foo%": "bar bar bar"
                };

                Object.keys(inputs).forEach(key => assert.equal(
                    new WshShell(ctx).ExpandEnvironmentStrings(key),
                    inputs[key]
                ));
            });

            it("should ignore the envvar when it cannot be found", () => {
                assert.equal(
                    new WshShell(ctx).ExpandEnvironmentStrings(
			"test %unknown% %env% %var% test"
		    ),
                    "test %unknown% %env% %var% test"
                );
            });
        });

        describe("#LogEvent", () => {

            it("should throw type mismatch when the log type is invalid", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_type_mismatch: () => {
                            throw new Error("unknown log type");
                        }
                    }
                });

                assert.throws(
		    () => new WshShell(ctx).LogEvent("",   "xx"),"unknown log type"
		);

                assert.throws(
		    () => new WshShell(ctx).LogEvent("0!", "xx"),"unknown log type"
		);

                // does not throw for string|number values.
                assert.doesNotThrow(() => new WshShell(ctx).LogEvent(0,   "xx"));
                assert.doesNotThrow(() => new WshShell(ctx).LogEvent("0", "xx"));
            });


            it("should throw type mismatch when 'message' is NULL", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_type_mismatch: () => {
                            throw new Error("message is null");
                        }
                    }
                });

                assert.throws(
		    () => new WshShell(ctx).LogEvent("", null), "message is null"
		);
            });

            it("should return false when trying to log to a remote host", () => {
                assert.isFalse(new WshShell(ctx).LogEvent(0, "xx", "foobar"));
            });

            it("should return true even when the message field is an empty string", () => {
                assert.isTrue(new WshShell(ctx).LogEvent(0, ""));
            });
        });

        describe("#Popup", () => {

            // When called without ANY args, throws:
            // name TypeError
            //message Wrong number of arguments or invalid property assignment
            it("should throw a TypeError when called without any arguments", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("no args given");
                        }
                    }
                });

                assert.throws(() => new WshShell(ctx).Popup(), "no args given");
            });

            it("should throw 'TypeMismatch' when message=NULL", () => {
                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_type_mismatch: () => {
                            throw new Error("msg is null");
                        }
                    }
                });

                assert.throws(() => new WshShell(ctx).Popup(null), "msg is null");
            });

            it("should throw when given a non-numeric (castable) type", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_type_mismatch: () => {
                            throw new Error("bad delay type");
                        }
                    }
                });

                const non_numeric_types = [
                    {}, [], null
                ];

                non_numeric_types.forEach(t => {
                    assert.throws(() => new WshShell(ctx).Popup("xx", t), "bad delay type");
                });
            });

            it("should throw if the delay value is a string but not a number", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_type_mismatch: () => {
                            throw new Error("not a num");
                        }
                    }
                });

                assert.throws(() => new WshShell(ctx).Popup("xx", "foobar"), "not a num");
            });

            it("should ignore undefined and negative values for delay", () => {
                assert.doesNotThrow(() => new WshShell(ctx).Popup("xx", undefined));
                assert.doesNotThrow(() => new WshShell(ctx).Popup("xx", -10));
            });

            it("should allow string and numeric delay seconds", () => {
                assert.doesNotThrow(() => new WshShell(ctx).Popup("xx", "3"));
                assert.doesNotThrow(() => new WshShell(ctx).Popup("xx", 3));
            });

            it("should throw when null or [] are set as title", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_type_mismatch: () => {
                            throw new Error("not a valid title");
                        }
                    }
                });

                assert.throws(() => new WshShell(ctx).Popup("x", 1, null), "not a valid title");
                assert.throws(() => new WshShell(ctx).Popup("x", 1, []),   "not a valid title");
            });

            it("should not throw for .toString types", () => {
                const types = [{}, undefined, 10, "yes"];
                types.forEach(t => {
                    assert.doesNotThrow(() => new WshShell(ctx).popup("x", 1, t));
                });
            });

            it("should throw if the delay value is a string but not a number", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_type_mismatch: () => {
                            throw new Error("not a num");
                        }
                    }
                });

                assert.throws(
                    () => new WshShell(ctx).Popup("a", 3, "c", "d"), "not a num"
                );
            });

            it("should not throw when the value is any number", () => {
                [-10, "10", "333.3333", 0xA].forEach(num => {
                    assert.doesNotThrow(() => new WshShell(ctx).Popup("a", 1, "c", num));
                });
            });
        });


        const RUNKEY = "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";

        describe("#ReadRead", () => {

            it("should successfully read an existing reg path", () => {
                assert.equal(new WshShell(ctx).RegRead(`${RUNKEY}\\bad`), "calc.exe");
            });

            it("should throw a type error when called without any args", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("no args");
                        }
                    }
                });

                assert.throws(() => new WshShell(ctx).RegRead(), "no args");
            });

            it("should throw when attempting to read an invalid registry root", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_native_vreg_invalid_root: () => {
                            var err = new Error();
                            err.name = "VirtualRegistryInvalidRoot";
                            throw err;
                        },
                        throw_invalid_reg_root: () => {
                            throw new Error("bad root");
                        }
                    }
                });

                assert.throws(() => new WshShell(ctx).RegRead("foobar"), "bad root");
            });

            it("should throw when attempting to read an unknown registry key", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_native_vreg_subkey_not_exists: () => {
                            var err = new Error();
                            err.name = "VirtualRegistryUnknownSubkey";
                            throw err;
                        },
                        throw_unknown_reg_subkey: () => {
                            throw new Error("unknown subkey");
                        }
                    }
                });

                assert.throws(
                    () => new WshShell(ctx).RegRead("HKLM\\non\\existant\\key"), "unknown subkey"
                );
            });
        });

        describe("#RegDelete", () => {

            it("should throw a type error when called without any args", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("no args");
                        }
                    }
                });

                assert.throws(() => new WshShell(ctx).RegDelete(), "no args");
            });

            it("should throw when trying to delete an unknown registry key", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_native_vreg_subkey_not_exists: () => {
                            var err = new Error();
                            err.name = "VirtualRegistryUnknownSubkey";
                            throw err;
                        },
                        throw_invalid_reg_root: () => {
                            throw new Error("unknown subkey");
                        }
                    }
                });

                assert.throws(
                    () => new WshShell(ctx).RegDelete(`${RUNKEY}\\not\\found`),
                    "unknown subkey"
                );
            });

            it("should delete an entire registry key when the path ends with \\", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_native_vreg_subkey_not_exists: () => {
                            var err = new Error();
                            err.name = "VirtualRegistryUnknownSubkey";
                            throw err;
                        },
                        throw_unknown_reg_subkey: () => {
                            throw new Error("unknown subkey");
                        }
                    }
                });

                const wsh = new WshShell(ctx);

                assert.equal(wsh.RegRead(`${RUNKEY}\\bad`),   "calc.exe");
                assert.equal(wsh.RegRead(`${RUNKEY}\\hello`), "world.exe");
                assert.doesNotThrow(() => new WshShell(ctx).RegDelete(`${RUNKEY}\\`));

                assert.throws(() => wsh.RegRead(`${RUNKEY}\\bad`),   "unknown subkey");
                assert.throws(() => wsh.RegRead(`${RUNKEY}\\hello`), "unknown subkey");
            });

            it("should throw when trying to delete an unknown registry key", () => {

                const wsh = new WshShell(ctx);


                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_native_vreg_subkey_not_exists: () => {
                            var err = new Error();
                            err.name = "VirtualRegistryUnknownSubkey";
                            throw err;
                        },
                        throw_invalid_reg_root: () => {
                            throw new Error("unknown subkey");
                        }
                    }
                });

                assert.throws(() => new WshShell(ctx).RegDelete("HKLM\\unknown\\value"), "unknown subkey");
            });
        });

        describe("#RegWrite", () => {

            it("should throw a type error when called with too few args", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("no args");
                        }
                    }
                });

                assert.throws(() => new WshShell(ctx).RegWrite(), "no args");
                assert.throws(() => new WshShell(ctx).RegWrite(RUNKEY), "no args");
            });

            it("should throw when given an invalid registry root", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_native_vreg_invalid_root: () => {
                            var err = new Error();
                            err.name = "VirtualRegistryInvalidRoot";
                            throw err;
                        },
                        throw_invalid_reg_root: () => {
                            throw new Error("bad root");
                        }
                    }
                });

                assert.throws(
                    () => new WshShell(ctx).RegWrite("NEW_ROOT\\foo", "calc.exe"),
                    "bad root"
                );
            });

            it("should create a full path when given a valid root", () => {

                make_context({
                    config: CONFIG,
                    exceptions: {
                        throw_native_vreg_subkey_not_exists: () => {
                            var err = new Error();
                            err.name = "VirtualRegistryUnknownSubkey";
                            throw err;
                        },
                        throw_unknown_reg_subkey: () => {
                            throw new Error("unknown subkey");
                        }
                    }
                });

                const wsh  = new WshShell(ctx);

                let missing_key_path = `${RUNKEY}\\foo`.replace("Microsoft", "Redmond");

                // First, test that the path doesn't already exist...
                assert.throws(() => wsh.RegRead(missing_key_path), "unknown subkey");

                // Second, create the path.
                assert.doesNotThrow(() => wsh.RegWrite(missing_key_path, "value.exe"));

                // Finally, read it back to make sure the path was created.
                assert.equal(wsh.RegRead(missing_key_path), "value.exe");
            });
        });
    });
});
