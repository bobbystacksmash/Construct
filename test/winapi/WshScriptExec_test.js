const assert        = require("chai").assert,
      WshScriptExec = require("../../src/winapi/WshScriptExec"),
      make_ctx      = require("../testlib");

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

describe("WshScriptExec", () => {

    beforeEach(function () {
        make_context({
            config: CONFIG
        });
    });

    describe("Construction", () => {

        it("should support creating a WshScriptExec instance", () => {
            assert.doesNotThrow(() => new WshScriptExec(ctx));
        });

        it("should be created with sensible default values", () => {
            const exec = new WshScriptExec(ctx);
            assert.equal(exec.stdin.ReadAll(),  "<STDIN>");
            assert.equal(exec.stdout.ReadAll(), "<STDOUT>");
            assert.equal(exec.stderr.ReadAll(), "<STDERR>");
        });
    });

    describe(".Status", () => {

        it("should return '1' (finished) for all calls to .status", () => {
            assert.equal(new WshScriptExec(ctx).status, 1);
        });

        it("should throw if .status is assigned to", () => {

            make_context({
                config: CONFIG,
                exceptions: {
                    throw_wrong_argc_or_invalid_prop_assign: () => {
                        throw new Error("cannot assign");
                    }
                }
            });

            assert.throws(() => new WshScriptExec(ctx).status = 0, "cannot assign");
        });
    });

    describe(".StdErr", () => {

        it("should return the Standard Error stream", () => {
            assert.equal(new WshScriptExec(ctx).stderr.readall(), "<STDERR>");
        });

        it("should export the given stderr stream value", () => {
            assert.equal(
                new WshScriptExec(ctx, { stderr: "_STDERR_" }).stderr.readall(),
                "_STDERR_"
            );
        });

        it("should throw 'bad file mode' if trying to write to the stream", () => {

            make_context({
                config: CONFIG,
                exceptions: {
                    throw_bad_file_mode: () => {
                        throw new Error("bad file mode");
                    }
                }
            });

            const wsexec = new WshScriptExec(ctx, { stdout: "_STDERR_" }),
                  stream = wsexec.stderr;
            assert.throws(() => stream.writeline("test"), "bad file mode");
        });
    });


    describe(".StdOut", () => {

        it("should return the Standard Out stream", () => {
            assert.equal(new WshScriptExec(ctx).stdout.readall(), "<STDOUT>");
        });

        it("should export the given stdout stream value", () => {
            assert.equal(
                new WshScriptExec(ctx, { stdout: "_STDOUT_" }).stdout.readall(),
                "_STDOUT_"
            );
        });

        it("should throw 'bad file mode' if trying to write to the stream", () => {

            make_context({
                config: CONFIG,
                exceptions: {
                    throw_bad_file_mode: () => {
                        throw new Error("bad file mode");
                    }
                }
            });

            const wsexec = new WshScriptExec(ctx, { stdout: "_STDOUT_" }),
                  stream = wsexec.stdout;
            assert.throws(() => stream.writeline("test"), "bad file mode");
        });
    });


    describe(".StdIn", () => {

        it("should return the Standard In stream", () => {
            assert.equal(new WshScriptExec(ctx).stdin.readall(), "<STDIN>");
        });

        it("should export the given stdin stream value", () => {
            assert.equal(
                new WshScriptExec(ctx, { stdin: "_STDIN_" }).stdin.readall(),
                "_STDIN_"
            );
        });

        it("should throw 'bad file mode' if trying to write to the stream", () => {

            make_context({
                config: CONFIG,
                exceptions: {
                    throw_bad_file_mode: () => {
                        throw new Error("bad file mode");
                    }
                }
            });

            const wsexec = new WshScriptExec(ctx, { stdout: "_STDOUT_" }),
                  stream = wsexec.stdout;
            assert.throws(() => stream.writeline("test"), "bad file mode");
        });
    });

    describe("#Termintae", () => {

        it("should call terminate and return undefined", () => {
            assert.doesNotThrow(() => new WshScriptExec(ctx).terminate());
            assert.equal(new WshScriptExec(ctx).terminate(), undefined);
        });

        it("should throw 'not a collection' if .terminate() is passed args", () => {
            make_context({
                config: CONFIG,
                exceptions: {
                    throw_object_not_a_collection: () => {
                        throw new Error("!collection");
                    }
                }
            });

            assert.throws(() => new WshScriptExec(ctx).terminate(123), "!collection");
        });
    });
});
