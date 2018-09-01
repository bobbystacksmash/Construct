/*
 * https://msdn.microsoft.com/en-us/en-en/library/2f38xsxe(v=vs.84).aspx
 *
 * The WshScriptExec object is returned by the Exec method of the WshShell
 * object. The Exec method returns the WshScriptExec object either once the
 * script or program has finished executing, or before the script or program
 * begins executing.
 *
 * PROPERTIES
 *  - ExitCode   https://msdn.microsoft.com/en-us/za76z6hh(v=vs.84)
 *  - ProcessID  https://msdn.microsoft.com/en-us/x78640t0(v=vs.84)
 *  - Status     https://msdn.microsoft.com/en-us/443b45a5(v=vs.84)
 *  - StdErr     https://msdn.microsoft.com/en-us/ye284tb8(v=vs.84)
 *  - StdIn      https://msdn.microsoft.com/en-us/yzzwsz3t(v=vs.84)
 *  - StdOut     https://msdn.microsoft.com/en-us/cbxxzwb5(v=vs.84)
 *
 *  METHODS
 *   - Terminate https://msdn.microsoft.com/en-us/yk84ffsf(v=vs.84)
 */

const proxify           = require("../proxify2"),
      Component         = require("../Component"),
      TextStream        = require("./TextStream");

class JS_WshScriptExec extends Component {

    constructor (context, execobj) {
        super(context, "WshScriptExec");
        this.context = context;

        execobj = execobj || {};
        const default_execobj = {
            stdin: "<STDIN>",
            stdout: "<STDOUT>",
            stderr: "<STDERR>"
        };

        execobj = Object.assign(default_execobj, execobj);

        this._status = {
            running  : 0,
            finished : 1
        };

        const allow_reads   = true,
              forbid_writes = 0;

        this._stdin = new TextStream(
            context,
            { stream: "generic", contents: execobj.stdin },
            true,
            forbid_writes
        );

        this._stdout = new TextStream(
            context,
            { stream: "generic", contents: execobj.stdout },
            allow_reads,
            forbid_writes
        );

        this._stderr = new TextStream(
            context,
            { stream: "generic", contents: execobj.stderr },
            allow_reads,
            forbid_writes
        );
    }

    get status () {
        return this._status.finished;
    }

    set status (_) {
        this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
            "WshScriptExec",
            "Cannot assign to .status property.",
            "Cannot assign to .status property."
        );
    }

    get stderr () {
        return this._stderr;
    }

    get stdin () {
        return this._stdin;
    }

    get stdout () {
        return this._stdout;
    }

    terminate () {

        if (arguments.length !== 0) {
            this.context.exceptions.throw_object_not_a_collection(
                "WshScriptExec",
                "The .terminate() method must be called with zero parameters.",
                "The .terminate() method must be called with zero parameters."
            );
        }

        return undefined;
    }
}

module.exports = function (context, execobj) {
    var wsh_script_exec = new JS_WshScriptExec(context, execobj);
    return proxify(context, wsh_script_exec);
};
