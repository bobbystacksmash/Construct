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
 *  - CurrentDirectory
 *  - Environment
 *  - SpecialFolders
 *
 * METHODS
 *  - AppActivate
 *  - CreateShortcut
 *  - Exec
 *  - ExpandEnvironmentStrings
 *  - LogEvent
 *  - Popup
 *  - RegDelete
 *  - RegRead
 *  - RegWrite
 *  - Run
 *  - SendKeys
 */

const winevts = require("../events");
const Proxify = require("../proxify");

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
            ee.emit(
                winevts.WINAPI.WScript.WshShell.SpecialFolders.get,

                // FIXME - set a special folders handler up to catch
                //         property access.

            );
            return (special_folders[name]) ? special_folders[name] : "";
        }
    };
}


function mock_CreateObject (type) {
    mock_MISSING_METHOD("WScript.CreateObject");
}


var mock_WshShell_API = {

};


function create(opts) {

    ee = opts.emitter || { emit: () => {}, on: () => {} };

    let mock_WshShell_API = {
        SpecialFolders: make_mock_WshShell_SpecialFolders_prop()
    };

    let overrides = {
        get: (target, key) => {
            if (key === "SpecialFolders") {
                return mock_WshShell_API.SpecialFolders;
            }
        }
    };

    var proxify = new Proxify({ emitter: ee });
    return proxify(mock_WshShell_API, overrides, "WshShell");
}

module.exports = create;
