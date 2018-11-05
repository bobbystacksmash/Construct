const proxify              = require("../proxify2"),
      Component            = require("../Component"),
      JS_WshEnvironment    = require("./WshEnvironment"),
      JS_WshShortcut       = require("./WshShortcut"),
      JS_WshSpecialFolders = require("./WshSpecialFolders"),
      JS_WshScriptExec     = require("./WshScriptExec");

class JS_WshShell extends Component {

    constructor (context) {
        super(context, "WshShell");
        this.context = context;
        this.vfs     = this.context.vfs;
    }

    /**
     * Gets the running script's current directory.
     * @returns {string} The full-path to the script's CWD.
     */
    get currentdirectory () {
        return this.context.config.environment.cwd;
    }

    /**
     * Sets the running script's current directory.
     * @param {string} new_cwd String path to the new working
     * dir for this script.
     * @returns {string} The full-path to the script's new CWD.
     */
    set currentdirectory (new_cwd) {

        if (this.vfs.IsPathIllegal(new_cwd)) {
            this.context.exceptions.throw_generic_winapi_exception(
                "Error",
                "", // message
                -2147024773,
                "", // description
                `WshShell`,
                `Invalid path specified.`,
                `New path value given to wsh.currentdirectory is not a ` +
                    `valid Win32 path.`,
            );
        }

        if (typeof new_cwd !== "string" || ! this.context.vfs.FolderExists(new_cwd)) {
            this.context.exceptions.throw_generic_winapi_exception(
                "WshShell",
                `Unable to set the working directory to: ${new_cwd}.`,
                `The folder ${new_cwd} does not exist.`
            );
        }

        this.context.config.environment.cwd = new_cwd;
        return new_cwd;
    }

    /**
     * Returns the current WshEnvironment collection.
     * @returns {WshEnvironment} An environment collection.
     */
    get environment () {
        return JS_WshEnvironment(this.context, "SYSTEM");
    }

    /**
     * Throws a TypeError stating that assignment to this property is
     * not allowed.
     * @throws {TypeError}
     */
    set environment (_) {
        this.context.exceptions.throw_unsupported_prop_or_method(
            "WshShell",
            "The .Environment property cannot be assigned to.",
            "Assigning to the .Environment property is not allowed."
        );
    }

    /**
     * Returns a WshSpecialFolders collection.
     * @return {WshSpecialFolders} A WshSpecialFolders collection.
     */
    get specialfolders () {
        return new JS_WshSpecialFolders(this.context, "WshShell");
    }

    /**
     * Throws a TypeError stating that assignment to this property is
     * not allowed.
     * @throws {TypeError}
     */
    set specialfolders (_) {
        this.context.exceptions.throw_unsupported_prop_or_method(
            "WshShell",
            "The .SpecialFolders property cannot be assigned to.",
            "Assigning to the .SpecialFolders property is not allowed."
        );
    }


    /**
     * Activates an application window.  Cosntruct treats it as a NOOP.
     * @param {string} title The title of the application to activate.
     * @return {undefined}
     */
    appactivate (title) {
        if (arguments.length === 0) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WshShell",
                "AppActivate requires a 'title' argument.",
                "The AppActivate method requires the 'title' argument be present " +
		    "and defined."
            );
        }

        // We always return FALSE for now.  If we see this method
        // being used in malware, we can add code to support it
        // correctly.
        return false;
    }

    /**
     * Returns a reference to a new or an existing `WshShortcut`
     * object.
     *
     * @param {string} pathname The path to an existing or where to
     * create a new shortcut.
     *
     * @return {WshShortcut}
     */
    createshortcut (pathname) {
        if (/\.(?:lnk|url)$/i.test(pathname) === false) {
            this.context.exceptions.throw_subscript_out_of_range(
                "WshShell",
                "Shortcut paths must end with either .lnk or .url.",
                `The given shortcut path does not end with ".lnk" or ` +
                    `".url".`
            );
        }

        // Will load an existing shortcut if exists or create one if
        // not.
        //
        // TODO: Add support for .url paths.
        //
        return new JS_WshShortcut(this.context, pathname);
    }

    /**
     * Runs a command and returns a WshScriptExec object.
     *
     * @param {string} cmd - The external application's launch
     * string/command.
     *
     * @return {WshScriptExec}
     */
    exec (cmd) {
        // Things to test
        // --------------
        //   * Expand environment vars
        //   * WshScriptExec return obj
        //   * Correctly connected std{err,out} streams.
        return new JS_WshScriptExec(this.context);
    }

    /**
     * Expands an environment variable and returns its value.  An
     * environment variable is enclosed between to '%' symbols.
     *
     * @param {string} str - String containing environment vars.
     * @return {string}
     */
    expandenvironmentstrings (str) {

        const env_vars = Object.assign(
            {},
            this.context.config.environment.variables.system,
            this.context.config.environment.variables.user
        );

        return (function expand (str) {

            const env_var_re = /%[^%]+%/g;
            let match = env_var_re.exec(str);

            while (match !== null) {

                let orig_val   = match[0],
                    identifier = match[0].toLowerCase().replace(/%/g, "");

                let matching_evar = Object
                    .keys(env_vars)
                    .find(ev => ev.toLowerCase() === identifier);

                if (matching_evar) {
                    let value = env_vars[matching_evar];
                    str = str.replace(new RegExp(orig_val, "g"), value);
                    str = expand(str);
                }

                match = env_var_re.exec(str);
            }
            return str;
        }(str));
    }

    logevent (log_type, message, host) {

        const LOG_EVT_TYPES = {
            0:  "Success",
            1:  "Error",
            2:  "Warning",
            4:  "Information",
            8:  "Audit_Success",
            16: "Audit_Failure"
        };

        if (LOG_EVT_TYPES.hasOwnProperty(log_type) === false) {
            this.context.exceptions.throw_type_mismatch(
                "WshShell",
                "Unknown 'logType' value passed to LogEvent().",
                "The LogEvent() method accepts a 'logType' input which " +
                    "must be one of: [0, 1, 2, 4, 8, 16].  Any other value " +
                    "will cause this error to be thrown."
            );
        }

        if (message === null) {
            this.context.exceptions.throw_type_mismatch(
                "WshShell",
                "NULL passed as second parameter to WshShell.LogEvent().",
                "NULL is not a valid value for the message parameter.  " +
                    "Consider using a string value instead."
            );
        }


        if (host) {
            // We always return false for a remote target.
            return false;
        }

        return true;
    }

    /**
     * Displayes a message popup box.  Construct is "headless",
     * meaning there's no GUI, so we do not actually display anything
     * here - we just capture the events and move on.
     *
     * @param {string} message - message to display.
     * @param {number} delay   - number of seconds to wait before displaying.
     * @param {string} title   - title of the msgbox.
     * @param {number} type    - type of buttons and icons to use.
     *
     * @throws {TypeError}
     */
    popup (message, delay, title, type) {

        const POPUP_TYPES = {
            0:  "OK",
            1:  "OK and Cancel",
            2:  "Abort, Retry, Ignore",
            3:  "Yes, No, Cancel",
            4:  "Yes, No",
            5:  "Retry, Cancel",
            16: "Stop",
            32: "Question",
            48: "Exclamation",
            64: "Information"
        };

        // `message' param validation
        // ---------------------------
        if (arguments.length === 0) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WshShell",
                "Popup method called without any arguments.",
                "The #Popup() method requires at least a `message' " +
                    "parameter to operate correctly."
            );
        }
        else if (message === null) {
            this.context.exceptions.throw_type_mismatch(
                "WshShell",
                "Popup method called with message set to NULL",
                "The message field must be a type which implements " +
                    ".toString()."
            );
        }

        // `delay' param validation
        // ------------------------
        if (delay === undefined) {
            delay = 0;
        }

        if (/^(?:string|number)$/i.test(typeof delay) === false) {
            this.context.exceptions.throw_type_mismatch(
                "WshShell",
                "Unknown type assigned to Popup delay",
                "The delay (seconds) only accepts string or number" +
                    "types."
            );
        }
        else if (typeof delay === "string") {
            if (isNaN(parseFloat(delay))) {
                this.context.exceptions.throw_type_mismatch(
                    "WshShell",
                    "Delay seconds not a valid numeric value",
                    `The string value ${delay} cannot be cast to a ` +
                        `numeric value.`
                );
            }
        }

        // `title' param validation
        // ------------------------
        if (title === null || Array.isArray(title)) {
            this.context.exceptions.throw_type_mismatch(
                "WshShell",
                "Title does not accept non-string-castable types",
                "Title must be set to something which can be cast to " +
                    "a string."
            );
        }

        // `type' param validation
        // -----------------------
        if (type === undefined) {
            return;
        }

        if (POPUP_TYPES.hasOwnProperty(type) === false) {
            if (isNaN(parseFloat(type))) {
                this.context.exceptions.throw_type_mismatch(
                    "WshShell",
                    "Popup box type must be a number",
                    `Cannot use the value ${type} as a popup ` +
                        `box type.`
                );
            }
        }
    }

    /**
     * Deltes a key or value from the registry.
     *
     * @param {string} regpath - Registry key or value path to delete.
     */
    regdelete (regpath) {

        if (arguments.length === 0) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WshShell",
                "Cannot call WshShell.RegDelete without any arguments",
                "WshShell.RegDelete must be called with a valid registry path " +
                    "to delete."
            );
        }

        try {
            this.context.vreg.delete(regpath);
        }
        catch (e) {

            if (e.name === "VirtualRegistryUnknownSubkey") {
                this.context.exceptions.throw_invalid_reg_root(
                    "WshShell",
                    "The given registry path to delete is not recognised.",
                    `Error while trying to delete registry path: '${regpath}'.`,
                    regpath
                );
            }
        }
    }

    /**
     * Returns a read registry value.
     *
     * @param {string} regpath - The registry path to read.
     * @returns {string} regvalue - The registry value found at 'path'.
     */
    regread (regpath) {

        if (arguments.length === 0) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WshShell",
                "Cannot call WshShell.RegRead without any arguments",
                "WshShell.RegRead must be called with a valid registry path " +
                    "to read."
            );
        }

        try {
            const regval = this.context.vreg.read(regpath);
            return (regval === undefined) ? "" : regval;
        }
        catch (e) {

            if (e.name === "VirtualRegistryInvalidRoot") {
                this.context.exceptions.throw_invalid_reg_root(
                    "WshShell",
                    "Given registry root is not recognised.",
                    `Error while reading reg path: '${regpath}'.`,
                    regpath
                );
            }
            else if (e.name === "VirtualRegistryUnknownSubkey") {
                this.context.exceptions.throw_unknown_reg_subkey(
                    "WshShell",
                    `Given registry subkey not found.`,
                    `Unable to find subkey: "${regpath}"`,
                    regpath
                );
            }
        }
    }

    /**
     * Writes a given value to a given registry location.
     *
     * @param {string} key  - The registry path to write to.
     * @param {string} val  - The value to write to the registry.
     * @param {string} type - Registry value data-type identifier.
     */
    regwrite (key, value, type) {

        if (arguments.length <= 1 || arguments.length > 3) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WshShell",
                "Calls to WshShell.RegWrite must use between two and three params",
                "WshShell.RegWrite must be called with with two manditory params, " +
                    "'key' and 'value', and an optional third 'type'."
            );
        }

        if (value === null) {
            this.context.exceptions.throw_type_mismatch(
                "WshShell",
                "Cannot write value type to registry.",
                "The value type assigned to the registry path is not valid."
            );
        }

        const TYPES = [ "REG_SZ", "REG_EXPAND_SZ", "REG_DWORD", "REG_BINARY" ];

        if (arguments.length === 3) {
            // Do type validation
            if (TYPES.includes(type) === false) {
                this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                    "WshShell",
                    `Unknown registry value type: ${type}.`,
                    "Valid types permitted are: " + TYPES.join(",")
                );
            }
            else if (type === "REG_DWORD" && typeof value !== "number") {
                this.context.exceptions.throw_type_mismatch(
                    "WshShell",
                    "Unable to write non-number value when type is 'REG_DWORD'.",
                    "Type validation is applied to values written to the registry when " +
                        "the 'type' parameter is set.  In this instance, the type parameter " +
                        "is set to REG_DWORD (number), while the given type is not a numeric " +
                        `type, and therefore cannot be written.  Given type: ${typeof value}.`
                );
            }
        }

        try {
            this.context.vreg.write(key, value);
        }
        catch (e) {

            if (e.name === "VirtualRegistryInvalidRoot") {
                this.context.exceptions.throw_invalid_reg_root(
                    "WshShell",
                    "Given registry root is not recognised.",
                    `Error locating reg path: '${key}'.`,
                    key
                );
            }
            else if (e.name === "VirtualRegistryUnknownSubkey") {
                this.context.exceptions.throw_unknown_reg_subkey(
                    "WshShell",
                    `Given registry subkey not found.`,
                    `Unable to find subkey for writing: "${key}"`,
                    key
                );
            }
        }
    }

    /**
     * Runs a string command, similar to Exec.
     *
     * @param {string}  command      - The CMD.exe command to run.
     * @param {number}  winstyle     - The window style of the new process.
     * @param {boolean} [async=true] - Handles asynchronous running, true=async, false=wait.
     *
     * @returns {number} Represents the success (0) or failure (>=1).
     */
    run (command, winstyle, async) {

        if (arguments.length < 1 || arguments.length > 3) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WshShell",
                "Calls to WshShell.Run must be given at least one argument.",
                "WshShell.Run accepts one required param, and two optionals. "
            );
        }

        if (typeof command !== "string") {
            this.context.exceptions.throw_invalid_fn_arg(
                "WshShell",
                "The command-to-run argument must be a string.",
                "Can only run commands when the type is 'string'."
            );
        }

        if (winstyle === undefined) winstyle = 0;

        let throw_type_mismatch = function () {
            this.context.exceptions.throw_type_mismatch(
                "WshShell",
                "Given 'winstyle' type is not numeric.",
                "Only strings and number types can be given to 'winstyle', " +
                    "any other type causes this exception to be thrown."
            );
        }.bind(this);

        if (typeof winstyle === "boolean") {
            winstyle = (winstyle) ? 1 : 0;
        }

        winstyle = parseInt(winstyle, 10);

        if (isNaN(winstyle)) {
            throw_type_mismatch();
        }

        if (async === undefined) async = true;

        if (typeof async === "string" && /^\d+$/.test(async) === false) {
            this.context.exceptions.throw_type_mismatch(
                "WshShell",
                "Async type cannot be cast to a boolean",
                "The type or value given as the async parameter cannot be " +
                    "cast to a boolean."
            );
        }
        else if (typeof async === null) {
            this.context.exceptions.throw_type_mismatch(
                "WshShell",
                "Async type cannot be NULL",
                "The async type cannot be NULL in WshShell.Run()"
            );
        }
        else if (/^string|number|boolean$/i.test(typeof async) === false) {
            this.context.exceptions.throw_type_mismatch(
                "WshShell",
                "Async type cannot be cast to a boolean.",
                `The given async type (${typeof async}) cannot be cast ` +
                    "to a boolean."
            );
        }
    }

    /*sendkeys (keystroke) {

    }
*/
}

module.exports = function (context) {
    var wsh_shell = new JS_WshShell(context);
    return proxify(context, wsh_shell);
};
