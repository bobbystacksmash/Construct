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
                `New path value given to wsh.currentdirectory is not a valid Win32 path.`,
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
     * Returns a WshSpecialFolders collection.
     * @return {WshSpecialFolders} A WshSpecialFolders collection.
     */
    get specialfolders () {
        return new JS_WshSpecialFolders(this.context, "WshShell");
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

                let matching_evar = Object.keys(env_vars).find(ev => ev.toLowerCase() === identifier);
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

    /*
    //
    // PROPERTIES
    // ==========
    //
    // MSDN: https://msdn.microsoft.com/en-gb/library/0ea7b5xe(v=vs.84).aspx
    //
    // SYNOPSIS
    // ========
    //
    // The WshSpecialFolders object is a collection.  It contains the
    // entire set of Windows special folders, such as the Desktop
    // folder, the Start Menu folder, and the Personal Documents
    // folder.  The special folder name is used to index into the
    // collection to retrieve the special folder you want. The
    // SpecialFolders property returns an empty string if the
    // requested folder (folder_name) is not available.  For example,
    // Windows 95 does not have an AllUsersDesktop folder and returns
    // an empty string if strFolderNameis AllUsersDesktop.
    //
    // ARGUMENTS
    // =========
    //
    //   - `folder_name'
    //      The name of the special folder.
    //
    // USAGE
    // =====
    //
    //   var WshShell = WScript.CreateObject("WScript.Shell");
    //   strDesktop = WshShell.SpecialFolders("Desktop");
    //   var oShellLink = WshShell.CreateShortcut(strDesktop + "\\Shortcut Script.lnk");
    //
    get specialfolders () {
        return new JS_WshSpecialFolders(this.context);
    }

    // MSDN: https://msdn.microsoft.com/en-us/subscriptions/3cc5edzd(v=vs.84).aspx
    //
    // SYNOPSIS
    // ========
    //
    // Retrieves or changes the current active directory. The
    // CurrentDirectory returns a string that contains the fully
    // qualified path of the current working directory of the active
    // process.
    //
    get currentdirectory () {
        return this.context.config.environment.cwd;
    }

    set currentdirectory (new_cwd) {

        if (typeof new_cwd !== "string" || this.context.vfs.FolderExists(new_cwd) === false) {
            this.context.exceptions.throw_generic_winapi_exception(
                "WshShell",
                `Unable to set the working directory to: ${new_cwd}.`,
                `The folder ${new_cwd} does not exist.`
            );
        }

        this.context.config.environment.cwd = new_cwd;
    }

    // =======
    // METHODS
    // =======

    //
    // Environment
    // ~~~~~~~~~~~
    //
    // MSDN: https://msdn.microsoft.com/fr-fr/library/fd7hxfdd(v=vs.84).aspx
    //
    // SYNOPSIS
    // ========
    //
    // Returns the WshEnvironment object (a collection of environment
    // variables).
    //
    // ARGUMENTS
    // =========
    //
    //   - `type' [optional]
    //      Specifies the location of the environment variable.
    //
    // USAGE
    // =====
    //
    //   var WshShell = WScript.CreateObject("WScript.Shell");
    //   var WshSysEnv = WshShell.Environment("SYSTEM");
    //   WScript.Echo(WshSysEnv("NUMBER_OF_PROCESSORS"));
    //
    get environment () {
        return JS_WshEnvironment(this.context, "SYSTEM");
    }

    //
    //
    // AppActivate
    // ~~~~~~~~~~~
    //
    // MSDN: https://msdn.microsoft.com/en-us/subscriptions/wzcddbek(v=vs.84).aspx
    //
    // SYNOPSIS
    // ========
    //
    // This method changes the focus to the named application or
    // window. The window must be attached to the calling thread's
    // message queue. It does not affect whether it is maximized or
    // minimized. Focus moves from the activated application window
    // when the user takes action to change the focus (or closes the
    // window).
    //
    // ARGUMENTS
    // =========
    //
    //   - `title'
    //     Specifies which application to activate. This can
    //     be a string containing the title of the application (as it
    //     appears in the title bar) or the application's Process ID.
    //
    //
    // USAGE
    // =====
    //
    //   var WshShell = WScript.CreateObject("WScript.Shell");
    //   WshShell.Run("calc");
    //   WScript.Sleep(100);
    //   WshShell.AppActivate("Calculator");
    //
    appactivate(title) {
        return true;
    }

    //
    // CreateShortcut
    // ~~~~~~~~~~~~~~
    //
    // MSDN: https://msdn.microsoft.com/en-us/subscriptions/xsy6k3ys(v=vs.84).aspx
    //
    // SYNOPSIS
    // ========
    //
    // The `CreateShortcut' method returns either a WshShortcut object
    // or a WshURLShortcut object. Simply calling the CreateShortcut
    // method does not result in the creation of a shortcut. The
    // shortcut object and changes you may have made to it are stored
    // in memory until you save it to disk with the Save method. To
    // create a shortcut, you must:
    //
    //   1. Create an instance of a WshShortcut object.
    //   2. Initialize its properties.
    //   3. Save it to disk with the Save method.
    //
    // ARGUMENTS
    // =========
    //
    //   - pathname
    //     String value indicating the path name of the shortcut to
    //     create.
    //
    // USAGE
    // =====
    //
    //   var WshShell = WScript.CreateObject("WScript.Shell");
    //   strDesktop = WshShell.SpecialFolders("Desktop");
    //   var oShellLink = WshShell.CreateShortcut(strDesktop + "\\Shortcut Script.lnk");
    //   oShellLink.TargetPath = WScript.ScriptFullName;
    //   oShellLink.WindowStyle = 1;
    //   oShellLink.Hotkey = "CTRL+SHIFT+F";
    //   oShellLink.IconLocation = "notepad.exe, 0";
    //   oShellLink.Description = "Shortcut Script";
    //   oShellLink.WorkingDirectory = strDesktop;
    //   oShellLink.Save();
    //   var oUrlLink = WshShell.CreateShortcut(strDesktop + "\\Microsoft Web Site.url");
    //   oUrlLink.TargetPath = "http://www.microsoft.com";
    //   oUrlLink.Save();
    //
    createshortcut() {
        // TODO: if the path to the LNK file doesn't end with either
        // '.lnk' or '.url' then throw.
    }

    //
    // Exec
    // ~~~~
    //
    // MSDN: https://msdn.microsoft.com/en-us/subscriptions/ateytk4a(v=vs.84).aspx
    //
    // SYNOPSIS
    // ========
    //
    // Runs an application in a child command-shell, providing access
    // to the StdIn/StdOut/StdErr streams.
    //
    // ARGUMENTS
    // =========
    //
    //   - command
    //     String value indicating the command line used to run the
    //     script.  The command line should appear exactly as it
    //     would if you type it at the command prompt.
    //
    exec (command) {
        let exechook = this.context.get_exechook(command);
        return new JS_WshScriptExec(this.context, exechook);
    }

    //
    // ExpandEnvironmentStrings
    // ~~~~~~~~~~~~~~~~~~~~~~~~
    //
    // MSDN: https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/dy8116cf%28v%3dvs.84%29
    //
    // SYNOPSIS
    // ========
    //
    // When given a string which contains environment variables,
    // `ExpandEnvironmentStrings' will return the string with these
    // environment variables expanded.  For example:
    //
    //   INPUT  => "%AppData%"
    //   OUTPUT => "C:\Users\<user>\AppData\Roaming"
    //
    //
    // CONSTRUCT SPECIFIC INFORMATION
    // ==============================
    //
    // Environment variables are available via the `get_env' method of
    // `this.context'.  TODO: Add plugin hooks here.
    //
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

                let matching_evar = Object.keys(env_vars).find(ev => ev.toLowerCase() === identifier);
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

    logevent(type, message, target) {

    }

    popup (text, delay_seconds, title, type) {

    }

    regdelete (key) {

        try {
            this.context.vreg.delete(key);
        }
        catch (e) {

        }
    }

    regread (key) {
        return this.context.vreg.read(key);
    }

    regwrite (key, value) {
        this.context.vreg.write(key, value);
    }

    run (command) {

    }

    sendkeys (keystroke) {

    }
*/
}

module.exports = function (context) {
    var wsh_shell = new JS_WshShell(context);
    return proxify(context, wsh_shell);
};
