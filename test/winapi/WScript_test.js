const assert       = require("chai").assert;
const WScript      = require("../../src/winapi/WScript"),
      make_context = require("../testlib");

var ctx = null;

describe("WScript", () => {

    beforeEach(() => ctx = make_context());

    describe("Properties", () => {

        describe(".Application", () => {});

        describe(".Arguments", () => {

            it("should return an Arguments collection", () => {
                const wsh  = new WScript(ctx);
                assert.equal(wsh.arguments.length, 0);
            });

            it("should populate the Arguments collection when called with args", () => {
                const wsh = new WScript(ctx, {
                    arguments: [
                        { foo: "bar" },
                        "baz"
                    ]
                });

                assert.equal(wsh.arguments.length, 2);
            });

            it("should support calling the Arguments collection as a function", () => {

                const wsh  = new WScript(ctx, {
                    arguments: [
                        { foo: "bar" },
                        "baz"
                    ]
                });

                assert.equal(wsh.Arguments(1),      "baz");
                assert.equal(wsh.Arguments.item(1), "baz");
            });
        });

        describe(".Fullname", () => {});
        describe(".Name", () => {});
        describe(".Path", () =>{});
        describe(".ScriptFullName", () => {});
        describe(".ScriptName", () => {});
        describe(".StdErr", () => {});
        describe(".StdIn", () => {});
        describe(".StdOut", () => {});
        describe(".Version", () => {});


        /*describe(".BuildVersion", () => {

            it("should return the build version", (done) => {

                let ctx = Object.assign({}, context, {
                    ENVIRONMENT: { BuildVersion: 1234 }
                });

                let wsh = new WScript(ctx);

                assert.equal(wsh.BuildVersion, 1234);
                done();
            });

            it("should throw if BuildVersion is assigned-to", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("cannot assign to build ver");
                        }
                    }
                });

                let wsh = new WScript(ctx);
                assert.throws(() => wsh.Buildversion = 5, "cannot assign to build ver");
                done();
            });
        });

        describe(".FullName", () => {

            it("should return the script's full name", (done) => {

                let ctx = Object.assign({}, context, {
                    ENVIRONMENT: { FullName: "cscript" }
                });

                let wsh = new WScript(ctx);
                assert.equal(wsh.FullName, "cscript");

                done();
            });

            it("should throw if fullname is assigned to", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("cannot assign to fullname");
                        }
                    }
                });

                let wsh = new WScript(ctx);

                assert.throws(() => wsh.FullName = 5, "cannot assign to fullname");
                done();
            });
        });

        describe(".Interactive", () => {
            //
            // Skipping - not sure this is worth the time implementing.
            //
        });

        describe(".Name", () => {

            it("should return 'Windows Script Host'", (done) => {

                let ctx = Object.assign({}, context, {
                    ENVIRONMENT: { Name: "Windows Script Host" }
                });

                let wsh = new WScript(ctx);
                assert.equal(wsh.Name, "Windows Script Host");

                done();
            });

            it("should throw if .Name is assigned to", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("cannot set .Name");
                        }
                    }});

                let wsh = new WScript(ctx);

                assert.throws(() => wsh.Name = "wsh", "cannot set .Name");
                done();
            });
        });

        describe(".Path", () => {

            it("should return the environment path", (done) => {

                let ctx = Object.assign({}, context, {
                    ENVIRONMENT: { Path: "C:\\Windows\\system32" }
                });

                let wsh = new WScript(ctx);
                assert.equal(wsh.Path, "C:\\Windows\\system32");

                done();
            });

            it("should throw if .Path is assigned to", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("path is readonly");
                        }
                    }});

                let wsh = new WScript(ctx);
                assert.throws(() => wsh.Path = 12, "path is readonly");
                done();
            });
        });

        describe(".ScriptFullName", () => {

            it("should return the script's full name, including path", (done) => {

                let ctx = Object.assign({}, context, {
                    ENVIRONMENT: { ScriptFullName: "C:\\test.js" }
                });

                let wsh = new WScript(ctx);
                assert.equal(wsh.ScriptFullName, "C:\\test.js");

                done();
            });

            it("should throw if .ScriptFullName is assigned to", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("scriptfullname is readonly");
                        }
                    }});

                let wsh = new WScript(ctx);
                assert.throws(() => wsh.ScriptFullName = "yes",
                              "scriptfullname is readonly");
                done();
            });
        });

        describe(".ScriptName", () => {

            it("should return the script name", (done) => {

                let ctx = Object.assign({}, context, {
                    ENVIRONMENT: { ScriptName: "test.js" }
                });

                let wsh = new WScript(ctx);

                assert.equal(wsh.ScriptName, "test.js");
                done();
            });

            it("should throw if .ScriptName is assigned to", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("script name is read only");
                        }
                    }});

                let wsh = new WScript(ctx);
                assert.throws(() => wsh.ScriptName = "yes", "script name is read only");
                done();
            });
        });

        describe(".StdErr", () => {
            //
            // TODO
            // Not yet implemented.
            //
        });

        describe(".StdIn", () => {
            //
            // TODO
            // Not yet implemented.
            //
        });

        describe(".StdOut", () => {
            //
            // TODO
            // Not yet implemented.
            //
        });

        describe(".Version", () => {

            it("should return the version", (done) => {

                let ctx = Object.assign({}, context, {
                    ENVIRONMENT: { Version: "5.8" }
                });

                let wsh = new WScript(ctx);

                assert.equal(wsh.Version, "5.8");
                done();
            });

            it("should throw if .Version is assigned to", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_wrong_argc_or_invalid_prop_assign: () => {
                            throw new Error("version is read only");
                        }
                    }});

                let wsh = new WScript(ctx);
                assert.throws(() => wsh.Version = "yes", "version is read only");
                done();
            });
        });*/
    });

    describe("Methods", () => {

        /*describe("#ConnectObject", () => {});
        describe("#CreateObject", () => {

            it("should support creating different object types", (done) => {

                let wsh = new WScript(context);
                let ado = wsh.CreateObject("ADODB.Stream");

                ado.open();
                ado.WriteText("ado stream!");
                ado.position = 0;

                assert.equal(ado.ReadText(), "ado stream!");

                // We won't bother working with all of these types,
                // but just check that none of them throws...
                ["microsoft.xmlhttp", "wscript.shell", "shell.application", "adodb.stream"].forEach((x) => {
                    assert.doesNotThrow(() => wsh.CreateObject(x));
                });

                done();
            });

            it("should throw when asked to create an instance that does not exist", (done) => {

                let ctx = Object.assign({}, context, {
                    exceptions: {
                        throw_could_not_locate_automation_class: (cls, summary, desc, type) => {

                            assert.equal(type, "unknown.instance.type");
                            throw new Error("instance not found");
                        }
                    }});

                let wsh = new WScript(ctx);

                assert.throws(() => wsh.CreateObject("unknown.instance.type"), "instance not found");
                done();
            });
        });

        describe("#DisconnectObject", () => {
            //
            // TODO
            // Not yet implemented.
            //
        });

        describe("#Echo", () => {

            it("should write the args to the output buffer", (done) => {

                let ctx = Object.assign({}, context, {
                    write_to_ouput_buf: (msg) => {
                        assert.deepEqual(msg, "test foo bar baz");
                        done();
                    }
                });

                let wsh = new WScript(ctx);
                wsh.Echo("test", "foo", "bar", "baz");
            });

            it("should write CRLF to the output buf when passed no args", (done) => {

                let ctx = Object.assign({}, context, {
                    write_to_ouput_buf: (msg) => {
                        assert.deepEqual(msg, "");
                        done();
                    }
                });

                let wsh = new WScript(ctx);
                wsh.Echo();
            });
        });

        describe("#GetObject", () => {
            //
            // TODO
            // Not yet implemented.
            //
        });

        describe("#Quit", () => {

            it("should call the appropriate script-shutdown routine", (done) => {

                let ctx = Object.assign({}, context, {
                    shutdown: () => done()
                });

                (new WScript(ctx)).Quit(12);
            });

            it("should pass a shutdown value", (done) => {

                let ctx = Object.assign({}, context, {
                    shutdown: (x) => {
                        assert.equal(x, 12);
                        done();
                    }
                });

                (new WScript(ctx)).Quit(12);
            });
        });

        describe("#Sleep", () => {

            it("should pass ms on to the skew time function", (done) => {

                let ctx = Object.assign({}, context, {
                    skew_time_ahead_by: (ms) => {
                        assert.equal(ms, 1200);
                        done();
                    }
                });

                let wsh = new WScript(ctx);
                wsh.Sleep(1200);
            });

        });*/
    });

});
