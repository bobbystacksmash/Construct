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
 * [ ] CurrentDirectory https://msdn.microsoft.com/en-us/subscriptions/3cc5edzd(v=vs.84).aspx
 * [ ] Environment https://msdn.microsoft.com/en-us/subscriptions/fd7hxfdd(v=vs.84).aspx
 * [ ] SpecialFolders https://msdn.microsoft.com/en-us/subscriptions/0ea7b5xe(v=vs.84).aspx
 *
 * METHODS
 * [ ] AppActivate https://msdn.microsoft.com/en-us/subscriptions/wzcddbek(v=vs.84).aspx
 * [ ] CreateShortcut https://msdn.microsoft.com/en-us/subscriptions/xsy6k3ys(v=vs.84).aspx
 * [ ] Exec https://msdn.microsoft.com/en-us/subscriptions/ateytk4a(v=vs.84).aspx
 * [ ] ExpandEnvironmentStrings https://msdn.microsoft.com/en-us/subscriptions/dy8116cf(v=vs.84).aspx
 * [ ] LogEvent https://msdn.microsoft.com/en-us/subscriptions/b4ce6by3(v=vs.84).aspx
 * [ ] Popup https://msdn.microsoft.com/en-us/subscriptions/x83z1d9f(v=vs.84).aspx
 * [ ] RegDelete https://msdn.microsoft.com/en-us/subscriptions/293bt9hh(v=vs.84).aspx
 * [ ] RegRead https://msdn.microsoft.com/en-us/subscriptions/x05fawxd(v=vs.84).aspx
 * [ ] RegWrite https://msdn.microsoft.com/en-us/subscriptions/yfdfhz1b(v=vs.84).aspx
 * [ ] Run https://msdn.microsoft.com/en-us/subscriptions/d5fk67ky(v=vs.84).aspx
 * [ ] SendKeys https://msdn.microsoft.com/en-us/subscriptions/8c6yea83(v=vs.84).aspx
 */

const winevts       = require("../events");
const proxify2      = require("../proxify2");
const WshScriptExec = require("./WshScriptExec");

/*
 * ===============================
 * WScript.WshShell.SpecialFolders
 * ===============================
 *
 * TODO
 * ----
 *  [ ] Fetch this information from some sort of global profile (dunno)
 */
function make_WshShell_SpecialFolders_prop(opts) {

    var special_folders = [
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
        item: () => {
            return special_folders[4];
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
module.exports = function (opts) {

    let ee = opts.emitter;

    console.log("@@@@@ CREATING WSH SHELL");

    let WshShell = {
        SpecialFolders: make_WshShell_SpecialFolders_prop(),
        Exec: (cmd) => {
            console.log(`WScript.WshShell.Exec::cmd => \n   ${cmd}`);

            return new WshScriptExec(opts);
        }
    };

    return proxify2(WshShell, "WshShell", opts);
}
