const Component = require("../Component");

class JS_WshShortcut extends Component {

    constructor (context) {
	super(context, "WshShortcut");
	this.ee = this.context.emitter;
    }

    // GET Arguments
    // =============
    //
    // Gets the arguments as a single String.
    //
    get arguments () {

    }

    // SET Arguments
    // =============
    //
    // Sets the arguments passed through to the shortcut.
    //
    set arguments (args) {

    }

    // GET description
    // ===============
    //
    // Gets the description of the shortcut.
    //
    get description () {

    }

    // SET description
    // ===============
    //
    // Sets the description of the shortcut.
    //
    set description (desc) {

    }

    // Get FullName
    // ============
    //
    // Returns a string containing the full path to this lnk file.
    get fullname () {

    }

    // Set FullName
    // ============
    //
    // This is not allowed.
    //
    set fullname (_) {
        // throw...
    }

    // GET Hotkey
    // ==========
    //
    // Returns a string representing the hotkey associated with
    // launching this shortcut file.
    //
    get hotkey () {

    }

    // SET Hotkey
    // ==========
    //
    // Sets the hotkey key-combo.
    //
    set hotkey (combo) {

    }

    // GET IconLocation
    // ================
    //
    // Gets the IconLocation, ",0" by default.
    //
    get iconlocation () {
        return ",0";
    }

    // SET IconLocation
    // ================
    //
    // Sets the iconlocation.
    //
    set iconlocation (loc) {

    }

    // GET TargetPath
    // ==============
    //
    // Returns the path and filename to the shortcut's executable
    // file.  The value of a target path property can also include a
    // data file that's associated with an EXE.
    //
    get targetpath () {

    }

    // SET TargetPath
    // ==============
    //
    // Sets the target path and filename for the shortcut's
    // executable.
    //
    set targetpath (path) {

    }

    // GET WindowStyle
    // ===============
    //
    // Returns the current window style of the application launched by
    // this shortcut.  Valid values are:
    //
    //   | Value | Description                                     |
    //   |-------|-------------------------------------------------|
    //   |   1   | Activates and displays a window.                |
    //   |   3   | Activates the window and displays it maximised. |
    //   |   7   | Displays the window as a minimised window.      |
    //
    get windowstyle () {

    }

    // SET WindowStyle
    // ===============
    //
    // Sets the window style of the launched application.  See the
    // table defined for GET WindowStyle for valid options.
    //
    get windowstyle (style) {

    }

    // GET WorkingDirectory
    // ====================
    //
    // Gets the shortcut's working directory where the launched EXE
    // will start from.
    //
    get workingdirectory () {

    }

    // SET WorkingDirectory
    // ====================
    //
    // Sets the shortcut's working directory where the launched EXE
    // will start from.
    //
    set workingdirectory (working_dir) {

    }


    // Save
    // ====
    //
    // The shortcut is edited in memory until Save is called.  Save
    // will write the changed shortcut .lnk file to disk.
    //
    save () {

    }
}

module.exports = function create(context) {
    let lnk = new JS_WshShortcut(context);
    return proxify(context, lnk)
;
};
