const assert = require("chai").assert;
const WScript = require("../../src/winapi/WScript");

let context = {
    epoch: 1,
    ENVIRONMENT: { Arguments: { "foo": "bar" } },
    emitter: { emit: () => {} },
    exceptions: {},
    vfs: {}
};

describe("WScript", () => {

    describe("Properties", () => {

        describe(".Arguments", () => {

            it("should return the script arguments", (done) => {
                let wsh = new WScript(context);
                assert.deepEqual(wsh.arguments, context.ENVIRONMENT.Arguments);
                done();
            });
        });

        describe(".BuildVersion", () => {

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

        });


        describe(".StdIn", () => {});
        describe(".StdOut", () => {});
        describe(".Version", () => {});

    });

    describe("Methods", () => {

        describe("#ConnectObject", () => {});
        describe("#CreateObject", () => {});
        describe("#DisconnectObject", () => {});
        describe("#Echo", () => {});
        describe("#GetObject", () => {});
        describe("#Quit", () => {});
        describe("#Sleep", () => {});

    });

});
