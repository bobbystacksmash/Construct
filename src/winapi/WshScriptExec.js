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

const winevts = require("../events");
const Proxify = require("../proxify");

function mock_MISSING_METHOD (name) {
    let msg = `[WshShell.${name}] - METHOD NOT YET IMPLEMENTED.`;
    alert(msg)
    console.log(msg);
}

function create(opts) {

    ee = opts.emitter || { emit: () => {}, on: () => {} };
    
    let mock_WshScriptExec = {
        StdOut: "snakes"
    };

    let overrides = {
        get: (target, key) => {
            alert("WshScriptExec!");
            return mock_WshScriptExec[key]
        }
    };

    var proxify = new Proxify({ emitter: ee });
    return proxify(mock_WshScriptExec, {}, "WshScriptExec");
}

module.exports = create;
