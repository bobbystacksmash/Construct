const proxify   = require("../proxify2"),
      Component = require("../Component"),
      win32path = require("path").win32;

class JS_WshSpecialFolders extends Component {

    constructor (context, dirname) {

        super(context, "WshSpecialFolders");
        this.ee = this.context.emitter;

        this.dirname = dirname;

        const whoami = this.context.config.environment.whoami;

        this.special_folders = [
            { name: "allusersdesktop", path: "C:\\Users\\Public\\Desktop" },
            { name: "allusersstartmenu", path: "C:\\ProgramData\\Microsoft\\Windows\\Start Menu" },
            { name: "allusersprograms", path: "C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs" },
            { name: "allusersstartup", path: "C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup" },
            { name: "desktop", path: `C:\\Users\\${whoami}\\Desktop` },
            { name: "appdata", path: `C:\\Users\\${whoami}\\AppData\\Roaming` },
            { name: "printhood", path: `C:\\Users\\${whoami}\\AppData\\Roaming\\Microsoft\\Windows\\Printer Shortcuts` },
            { name: "templates", path: `C:\\Users\\${whoami}\\AppData\\Roaming\\Microsoft\\Windows\\Templates` },
            { name: "fonts", path: "C:\\Windows\\Fonts" },
            { name: "nethood", path: `C:\\Users\\${whoami}\\AppData\\Roaming\\Microsoft\\Windows\\Network Shortcuts` },
            { name: "desktop", path: `C:\\Users\\${whoami}\\Desktop` },
            { name: "startmenu", path: `C:\\Users\\${whoami}\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu` },
            { name: "sendto", path: `C:\\Users\\${whoami}\\AppData\\Roaming\\Microsoft\\Windows\\SendTo` },
            { name: "recent", path: `C:\\Users\\${whoami}\\AppData\\Roaming\\Microsoft\\Windows\\Recent` },
            { name: "startup", path: `C:\\Users\\${whoami}\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup` },
            { name: "favorites", path: `C:\\Users\\${whoami}\\Favorites` },
            { name: "documents", path: `C:\\Users\\${whoami}\\Documents` },
            { name: "programs", path: `C:\\Users\\${whoami}\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs` }
        ];
    }

    get length () {
        return this.special_folders.length;
    }

    count () {
        return this.special_folders.length;
    }

    item (id) {

        // An `id' can be either an integer or a string.
        if (typeof id === "number") {
            // TODO: what if the index is too large?
            return this.special_folders[id].path;
        }
        else if (typeof id === "string") {

            id = id.toLowerCase();
            let specdir = this.special_folders.find(sdir => sdir.name.toLowerCase() === id);
            if (specdir) {
                return specdir.path;
            }
        }
        else {
            // throw?
        }
    }
}

module.exports = function (context, dirname) {
    var wshdirs = new JS_WshSpecialFolders(context, dirname);
    return proxify(context, wshdirs);
};
