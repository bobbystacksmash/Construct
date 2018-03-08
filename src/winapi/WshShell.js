const Component         = require("../Component");
const JS_WshEnvironment = require("./WshEnvironment");

class JS_WshShell extends Component {

    constructor (context) {
	super(context, "WshShell");
	this.ee = this.context.emitter;

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

	return {
	    item: (n) => this._folders[n]
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

}

module.exports = function (context) {
    let wsh = new JS_WshShell(context);
    return wsh;
}
    
