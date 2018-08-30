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
      SupportTextStream = require("./support/TextStream"),
      TextStream        = require("./TextStream");

class JS_WshScriptExec extends Component {

    constructor (context, execobj) {
        super(context, "WshScriptExec");
        this.context = context;

        execobj = execobj || {};
        const default_execobj = {
            stdin: "",
            stdout: "",
            stderr: ""
        };

        execobj = Object.assign(default_execobj, execobj);

        /*this._stdout = new SupportTextStream(context);
         this.stdout.load_into_stream(execobj.stdout);*/

        this._stdin = new TextStream(
            context,
            { stream: "generic", contents: execobj.stdin }
        );

        this._stdout = new TextStream(
            context,
            { stream: "generic", contents: execobj.stdout }
        );

        this._stderr = new TextStream(
            context,
            { stream: "generic", contents: execobj.stderr }
        );
    }

    get status () {
        // TODO
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

}

module.exports = function (context, execobj) {
    var wsh_script_exec = new JS_WshScriptExec(context, execobj);
    return proxify(context, wsh_script_exec);
};
