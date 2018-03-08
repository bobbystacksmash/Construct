const Component         = require("../Component");
const JS_WshEnvironment = require("./WshEnvironment");

class JS_WshShell extends Component {

    constructor (context) {
	super(context, "WshShell");
	this.ee = this.context.emitter;

	this.special_folders = [
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
    }

    //
    // PROPERTIES
    // ==========
    //
    
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
    get CurrentDirectory () {
	let cwd = this.context.ENVIRONMENT.CurrentDirectory;
	this.ee.emit("@WshShell.CurrentDirectory [GET]", cwd);
	return cwd;
    }

    set CurrentDirectory (new_cwd) {
	let old_cwd = this.context.ENVIRONMENT.CurrentDirectory;
	this.ee.emit("@WshShell.CurrentDirectory [SET]", { new_cwd: new_cwd, old_cwd: old_cwd });
	this.context.ENVIRONMENT.CurrentDirectory = new_cwd;
    }


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
    get SpecialFolders () {
	this.ee.emit("@WshShell.SpecialFolders [GET]");

	let folders = this.special_folders,
	    emitter = this.ee;
	
	return {
	    item: function (n) {
		emitter.emit("@WshShell.SpecialFolders::item", folders[n]);
		return folders[n];
	    }
	};
    }
    

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
    Environment (type) {
	this.ee.emit("@WshShell.Environment", arguments);	
	let env = new JS_WshEnvironment(this.context);
	return env;
    }


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
    //
    // USAGE
    // =====
    //
    //   var WshShell = WScript.CreateObject("WScript.Shell");
    //   WshShell.Run("calc");
    //   WScript.Sleep(100);
    //   WshShell.AppActivate("Calculator");
    //
    AppActivate(todo) {
	// TODO
    }


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
    CreateShortcut() {
    }

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
    // RETURNS
    // =======
    //   I assume the exit status?
    //
    Exec () {

    }


    
    
    
	       
}

module.exports = function (context) {
    let wsh = new JS_WshShell(context);
    return wsh;
};
    
