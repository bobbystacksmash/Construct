var proxify2       = require("../proxify2"),
    XMLHttpRequest = require("./XMLHttpRequest"),
    events         = require("../events");

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

function WScript (ctx) {

    var ee = ctx.emitter,
        dt = ctx.date;

    function Echo () {
        let msg = Array.prototype.splice(arguments);
        ee.emit("@WScript::Echo", { msg: msg }, arguments);
    };

    function Sleep (milliseconds) {
        dt.skew(milliseconds);
        ee.emit("@WScript::Sleep", { time: milliseconds }, arguments);
    };

    function CreateObject (prog_id, prefix) {

        prog_id = prog_id.toLowerCase();

        switch(prog_id) {
            case "msxml2.serverxmlhttp":
                ee.emit("@WScript::CreateObject::MSXML2.ServerXMLHttp", { prog_id: prog_id }, arguments);
                var xhr = new XMLHttpRequest({ emitter: ee });
                return xhr;

            default:
                process.exit();
                break;
        }
    }



    var WScript = {
        Sleep: Sleep,
        CreateObject: CreateObject,
        Echo:  Echo,
    };

    return proxify2(WScript, "WScript", ctx);
}


module.exports = WScript;
