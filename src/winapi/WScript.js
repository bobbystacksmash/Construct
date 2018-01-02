var proxify2       = require("../proxify2"),
    XMLHttpRequest = require("./XMLHttpRequest"),
    evts           = require("../events");

/*
 * WScript Object Properties and Methods
 * =====================================
 *
 * https://msdn.microsoft.com/en-us/library/2795740w(v=vs.84).aspx
 *
 * PROPERTIES
 * ==========
 *
 * [ ] Arguments         https://msdn.microsoft.com/en-us/library/z2b05k8s(v=vs.84).aspx
 * [ ] BuildVersion      https://msdn.microsoft.com/en-us/library/kt8ycte6(v=vs.84).aspx
 * [ ] FullName          https://msdn.microsoft.com/en-us/library/z00t383b(v=vs.84).aspx
 * [ ] Interactive       https://msdn.microsoft.com/en-us/library/b48sxsw0(v=vs.84).aspx
 * [ ] Name              https://msdn.microsoft.com/en-us/library/3ktf76t1(v=vs.84).aspx
 * [ ] Path              https://msdn.microsoft.com/en-us/library/sw3e6ehs(v=vs.84).aspx
 * [ ] ScriptFullName    https://msdn.microsoft.com/en-us/library/cc5ywscw(v=vs.84).aspx
 * [ ] ScriptName        https://msdn.microsoft.com/en-us/library/3faf1xkh(v=vs.84).aspx
 * [ ] StdErr            https://msdn.microsoft.com/en-us/library/hyez2k48(v=vs.84).aspx
 * [ ] StdIn             https://msdn.microsoft.com/en-us/library/1y8934a7(v=vs.84).aspx
 * [ ] StdOut            https://msdn.microsoft.com/en-us/library/c61dx86d(v=vs.84).aspx
 * [ ] Version           https://msdn.microsoft.com/en-us/library/kaw07b53(v=vs.84).aspx
 *
 * METHODS
 * =======
 *
 * [ ] Echo              https://msdn.microsoft.com/en-us/library/h8f603s7(v=vs.84).aspx
 * [ ] GetObject         https://msdn.microsoft.com/en-us/library/8ywk619w(v=vs.84).aspx
 * [ ] Quit              https://msdn.microsoft.com/en-us/library/fw0fx1aw(v=vs.84).aspx
 * [ ] Sleep             https://msdn.microsoft.com/en-us/library/6t81adfd(v=vs.84).aspx
 * [ ] CreateObject      https://msdn.microsoft.com/en-us/library/xzysf6hc(v=vs.84).aspx
 * [ ] ConnectObject     https://msdn.microsoft.com/en-us/library/ccxe0xe6(v=vs.84).aspx
 * [ ] DisconnectObject  https://msdn.microsoft.com/en-us/library/2d26y0c1(v=vs.84).aspx
 *
 */

function WScript (opts) {

    var ee = opts.emitter,
        dt = opts.date;

    function Echo () {
    };

    function Sleep (milliseconds) {

        let time_before = dt.getTime();
        dt.skew(milliseconds);
        let time_after  = dt.getTime();
        console.log(`WScript.Sleep(${milliseconds}) - tbefore: ${time_before}, tafter: ${time_after}`);
        ee.emit(evts.WINAPI.WScript.Sleep, { time: milliseconds });
    };

    function CreateObject (prog_id, prefix) {

        prog_id = prog_id.toLowerCase();

        switch(prog_id) {
            case "msxml2.serverxmlhttp":
                // TODO: emit that this is happening
                console.log("Making ServerXMLHTTP!");
                var xhr = new XMLHttpRequest({ emitter: ee });
                return xhr;

            default:
                console.log(`WScript.CreateObject(${prog_id}) is not implemented!`);
                process.exit();
                break;
        }
    }



    var WScript = {
        Sleep: Sleep,
        CreateObject: CreateObject,
        Echo:  () => console.log("WScript.Echo::", ...arguments),
    };

    return proxify2(WScript, "WScript", opts);
}


module.exports = WScript;
