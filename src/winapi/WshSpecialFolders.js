const proxify   = require("../proxify2"),
      Component = require("../Component"),
      win32path = require("path").win32;

class JS_WshSpecialFolders extends Component {

    constructor (context, dirname) {

        super(context, "WshSpecialFolders");
        this.ee = this.context.emitter;

        const whoami = this.context.config.general.whoami || "PC-162";

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

    set length (_) {
        this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
            "WshSpecialFolders",
            "Cannot assign a value to the .length property.",
            "Cannot assign a value to the .length property."
        );
    }

    count () {

        if (arguments.length > 0) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WshSpecialFolders",
                "The .Count() method accepts zero arguments.",
                "The .Count() method accepts zero arguments."
            );
        }

        return this.special_folders.length;
    }

    item (id) {

        if (arguments.length === 0) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WshSpecialFolders",
                "Exception thrown when no args are passed to .item method.",
                "Exception thrown when no args are passed to .item method."
            );
        }

        let num_spec_dirs = this.special_folders.length;

        // An `id' can be either an integer or a string.
        if (typeof id === "number") {



            if (id < 0 || id >= num_spec_dirs) {
                this.context.exceptions.throw_subscript_out_of_range(
                    "WshSpecialFolders",
                    `Item by index (${id}) is out of range.`,
                    `The requested item cannot be indexed because the supplied ` +
                        `index (${id}) is outside the range of indexes supported ` +
                        `by this collection (min: 0, max: ${num_spec_dirs - 1}.`
                );
            }

            return this.special_folders[id].path;
        }
        else if (typeof id === "string") {

            id = id.toLowerCase();
            let specdir = this.special_folders.find(sdir => sdir.name.toLowerCase() === id);
            return (specdir) ? specdir.path : "";
        }
        else if (id == false || id == null) {
            return this.special_folders[0].path;
        }
        else if (id === true) {
            this.context.exceptions.throw_subscript_out_of_range(
                "WshSpecialFolders",
                `Item by index 'true' evaluates to -1 (out of range for this collection).`,
                `The argument to .item is the boolean TRUE, which JScript converts to -1, ` +
                    `which is outside the range of indexes supported by this collection ` +
                    `(min: 0, max: ${num_spec_dirs - 1}.`
            );
        }
        else {
            return this.special_folders[0].path;
        }
    }
}

module.exports = function (context, caller) {

    const default_specdirs = new JS_WshSpecialFolders(context);

    var wrapper = (function (props) {

        function WshSpecDirWrapper (dir) {
            // TODO: test `type' and either return the WshSpecDirs
            // collection, or return the string path of the given
            // type.

            if (dir === undefined || dir === null || arguments.length === 0) {
                context.exceptions.throw_unsupported_prop_or_method(
                    caller || "WshSpecialFolders",
                    "Cannot create SpecialFolders instance as a method without an argument.",
                    "The .SpecialFolders object (created from WshShell) can either be called as " +
                        "a property, or it must be called as a method with an argument."
                );
            }

            if (dir || typeof dir === "number") {
                const specdir = new JS_WshSpecialFolders(context);
                return specdir.item(dir);
            }
            else {
                return proxify(context, new JS_WshSpecialFolders(context));
            }
        };

        for (let prop in props) {
            WshSpecDirWrapper[prop] = props[prop];
        }

        // TODO: what is this?
        Object.defineProperty(WshSpecDirWrapper, "length", {
            get: function ()  { return default_specdirs.length;     },
            set: function (x) { return default_specdirs.length = x; }
        });

        return WshSpecDirWrapper;
    }({
        count: (...args) => default_specdirs.count(...args),
        item:  (...args) => default_specdirs.item(...args),

        __name__: "WshSpecialFolders",
        __id__: default_specdirs.__id__
    }));

    return proxify(context, wrapper);
};
