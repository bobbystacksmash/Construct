/*
 * WScript Object Properties and Methods
 * =====================================
 *
 * https://msdn.microsoft.com/en-us/library/2795740w(v=vs.84).aspx
 *
 * PROPERTIES
 *  - Arguments         https://msdn.microsoft.com/en-us/library/z2b05k8s(v=vs.84).aspx
 *  - BuildVersion      https://msdn.microsoft.com/en-us/library/kt8ycte6(v=vs.84).aspx
 *  - FullName          https://msdn.microsoft.com/en-us/library/z00t383b(v=vs.84).aspx
 *  - Interactive       https://msdn.microsoft.com/en-us/library/b48sxsw0(v=vs.84).aspx
 *  - Name              https://msdn.microsoft.com/en-us/library/3ktf76t1(v=vs.84).aspx
 *  - Path              https://msdn.microsoft.com/en-us/library/sw3e6ehs(v=vs.84).aspx
 *  - ScriptFullName    https://msdn.microsoft.com/en-us/library/cc5ywscw(v=vs.84).aspx
 *  - ScriptName        https://msdn.microsoft.com/en-us/library/3faf1xkh(v=vs.84).aspx
 *  - StdErr            https://msdn.microsoft.com/en-us/library/hyez2k48(v=vs.84).aspx
 *  - StdIn             https://msdn.microsoft.com/en-us/library/1y8934a7(v=vs.84).aspx
 *  - StdOut            https://msdn.microsoft.com/en-us/library/c61dx86d(v=vs.84).aspx
 *  - Version           https://msdn.microsoft.com/en-us/library/kaw07b53(v=vs.84).aspx
 *  - ConnectObject     https://msdn.microsoft.com/en-us/library/ccxe1xe6(v=vs.84).aspx
 *  - CreateObject      https://msdn.microsoft.com/en-us/library/xzysf6hc(v=vs.84).aspx
 *  - DisconnectObject  https://msdn.microsoft.com/en-us/library/2d26y0c1(v=vs.84).aspx
 *
 * METHODS
 *  - Echo              https://msdn.microsoft.com/en-us/library/h8f603s7(v=vs.84).aspx
 *  - GetObject         https://msdn.microsoft.com/en-us/library/8ywk619w(v=vs.84).aspx
 *  - Quit              https://msdn.microsoft.com/en-us/library/fw0fx1aw(v=vs.84).aspx
 *  - Sleep             https://msdn.microsoft.com/en-us/library/6t81adfd(v=vs.84).aspx
 *
 */

const winevts = require("../events");
const Proxify = require("../proxify");

function mock_MISSING_METHOD (name) {
    let msg = `[WScript.${name}] - METHOD NOT YET IMPLEMENTED.`;
    alert(msg)
    console.log(msg);
}

/*
 * ===================
 * WScript.Arguments()
 * ===================
 *
 * TODO:
 * [ ] Add a '.Length' property to this function.
 *
 */
function mock_Arguments (arg) {
    console.log("[WScript.Arguments] - TODO");
    return true;
}


/*
 * ============
 * WScript.Echo
 * ============
 *
 */
function mock_Echo (msg) {
    console.info(`[WScript.Echo] - "${msg}"`);
}


/*
 * =============
 * WScript.Sleep
 * =============
 *
 */
function mock_Sleep (time) {
    debugger;
    alert(`[WScript.Sleep] - Sleeping for ${time} seconds...`);
}


/*
 * =============
 * WScript.Shell
 * =============
 *
 */
function mock_Shell () {
    alert("TODO!");
}


/*
 * ====================
 * WScript.CreateObject
 * ====================
 *
 */
function mock_CreateObject (type) {
    mock_MISSING_METHOD("WScript.CreateObject");
}


/*
 * =================
 * WScript.GetObject
 * =================
 *
 */
function mock_GetObject () {
    mock_MISSING_METHOD("WScript.GetObject");
}




var mock_WScript_API = {
    Arguments: mock_Arguments,

    Echo: (msg) => {
        //generic_message("WScript.Echo", msg);
    },


    Shell: () => {
        console.log("!!!! - implement SHELL API");
    }
};

function create(opts) {

    ee = opts.emitter || { emit: () => {}, on: () => {} };

    let mock_WScript_API = {
        Arguments: mock_Arguments,
        Echo:      mock_Echo,
        Sleep:     mock_Sleep,
        Shell:     mock_Shell,
        CreateObject: mock_CreateObject,
        GetObject:    mock_GetObject
    };

    var proxify = new Proxify({ emitter: ee });
    return proxify(mock_WScript_API, {}, "WScript");
}

module.exports = create;
