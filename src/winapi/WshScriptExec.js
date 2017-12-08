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

const proxify2   = require("../proxify2");
const TextStream = require("./TextStream");

module.exports = function WshScriptExec (opts) {

    debugger; 
    console.log("><><><><><><><>><<>><><>><<>>");

    let ee = opts.emitter;

    let stdout = new TextStream({ emitter: ee, buffer: "stdout buf" });
    let stdin  = new TextStream({ emitter: ee, buffer: "stdin  buf" });
    let stderr = new TextStream({ emitter: ee, buffer: "stderr buf" });

    let WshScriptExec = {
        ExitCode: 0,
        ProcessID: 1337,
        Status: 1, // Wsh Finished
        StdErr: stderr,
        StdIn: stdin,
        StdOut: stdout,

        Terminate: () => {}
    };

    return proxify2(WshScriptExec, "WshScriptExec", opts);
};


