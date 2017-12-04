/*
 * https://msdn.microsoft.com/en-us/subscriptions/aew9yb99(v=vs.84).aspx
 *
 * You create a WshShell object whenever you want to run a program locally,
 * manipulate the contents of the registry, create a shortcut, or access a
 * system folder. The WshShell object provides the Environment collection. This
 * collection allows you to handle environmental variables (such as WINDIR,
 * PATH, or PROMPT).
 *
 * PROPERTIES
 * [ ] -  CurrentDirectory
 * [ ] -  Environment
 * [ ] -  SpecialFolders https://msdn.microsoft.com/en-us/subscriptions/0ea7b5xe(v=vs.84).aspx
 *
 * METHODS
 * [ ] -  AppActivate
 * [ ] -  CreateShortcut
 * [ ] -  Exec
 * [ ] -  ExpandEnvironmentStrings
 * [ ] -  LogEvent
 * [ ] -  Popup
 * [ ] -  RegDelete
 * [ ] -  RegRead
 * [ ] -  RegWrite
 * [ ] -  Run
 * [ ] -  SendKeys
 */

const winevts           = require("../events");
const Proxify           = require("../proxify");
const WshScriptExec_API = require("./WshScriptExec");
const TextStream_API    = require("./TextStream");

var ee;

function mock_MISSING_METHOD (name) {
    let msg = `[WshShell.${name}] - METHOD NOT YET IMPLEMENTED.`;
    alert(msg)
    console.log(msg);
}


/*
 * ===============================
 * WScript.WshShell.SpecialFolders
 * ===============================
 *
 * TODO
 * ----
 *  [ ] Fetch this information from some sort of global profile (dunno)
 */
function make_mock_WshShell_SpecialFolders_prop() {

    let special_folders = [
        "AllUsersDesktop",
        "AllUsersStartMenu",
        "AllUsersPrograms",
        "AllUsersStartup",
        "Desktop",
        "Favorites",
        "Fonts",
        "MyDocuments",
        "NetHood",
        "PrintHood",
        "Programs",
        "Recent",
        "SendTo",
        "StartMenu",
        "Startup",
        "Templates"
    ];

    return {
        item: (name) => {
            ee.emit(winevts.WINAPI.WScript.WshShell.SpecialFolders.get, {
                highlight:   "wshshell.SpecialFolders",
                description: winevts.WINAPI.WScript.WshShell.SpecialFolders.get_help
            });
            return (special_folders[name]) ? special_folders[name] : "";
        }
    };
}

/*
 * =====================
 * WScript.WshShell.Exec
 * =====================
 *
 * TODO
 * ----
 *  + Really important we add some kind of solid alerting for this event.
 */
function mock_WshShell_Exec (cmd) {

    console.log(`WScript.WshShell.Exec::cmd => \n   ${cmd}`);

    // Let's wire-up IO for this "process".
    var buf_stdin  = TextStream_API({ emitter: ee }),
        buf_stdout = TextStream_API({ emitter: ee }),
        buf_stderr = TextStream_API({ emitter: ee });

    // Create a new WshScriptExec instance!
    let WshScriptExec = WshScriptExec_API({ 
        emitter: ee,
        stdin:   buf_stdin,
        stdout:  buf_stdout,
        stderr:  buf_stderr
    });

    return WshScriptExec;
}


function mock_CreateObject (type) {
    mock_MISSING_METHOD("WScript.CreateObject");
}


function create(opts) {

    ee = opts.emitter || { emit: () => {}, on: () => {} };

    let mock_WshShell_API = {
        SpecialFolders: make_mock_WshShell_SpecialFolders_prop(),
        Exec: mock_WshShell_Exec
    };

    let overrides = {
        get: (target, key) => {
            return mock_WshShell_API[key]
        }
    };

    // EVENTING
    // ========
    // Q: Why no winevts.WINAPI.WScript.WshShell.new event?
    //
    // A: Much like ADODB Streams, a WshShell instance can only be created
    //    through either an ActiveXObject or the CreateObject function. Both
    //    of these functions will emit the alert that an instance was created.

    var proxify = new Proxify({ emitter: ee });
    return proxify(mock_WshShell_API, overrides, "WshShell");
}

module.exports = create;
