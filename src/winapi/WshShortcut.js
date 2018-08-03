const Component = require("../Component"),
      proxify   = require("../proxify2");

class JS_WshShortcut extends Component {

    constructor (context, backing_path) {
	super(context, "WshShortcut");

        this.context = this.context;
	this.ee      = this.context.emitter;

        this.backing_path = backing_path;

        let lnk = {
            _arguments: "",
            _description: "",
            _fullname: "",
            _hotkey: "",
            _targetpath: "",
            _iconlocation: ",0",
            _windowstyle: 1,
            _workingdirectory: ""
        };

        if (this.context.vfs.Exists(backing_path)) {
            let json = this.context.vfs.ReadFileContents(this.backing_path),
                shortcut = JSON.parse(json);
            lnk = Object.assign({}, lnk, shortcut);
        }

        this.shortcut = lnk;
    }

    // GET Arguments
    // =============
    //
    // Gets the arguments as a single String.
    //
    get arguments () {
        return this.shortcut._arguments;
    }

    // SET Arguments
    // =============
    //
    // Sets the arguments passed through to the shortcut.
    //
    set arguments (args) {
        this.shortcut._arguments = args;
        return this.arguments;
    }

    // GET description
    // ===============
    //
    // Gets the description of the shortcut.
    //
    get description () {
        return this.shortcut._description;
    }

    // SET description
    // ===============
    //
    // Sets the description of the shortcut.
    //
    set description (desc) {
        this.shortcut._description = desc;
        return this.description;
    }

    // Get FullName
    // ============
    //
    // Returns a string containing the full path to this lnk file.
    get fullname () {
        return this.backing_path;
    }

    // Set FullName
    // ============
    //
    // This is not allowed.
    //
    set fullname (_) {

        this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
            "WshShortcut",
            "Cannot assign to property: 'FullName'.",
            "The '.FullName' property cannot be assigned to.  It is a read-only " +
                "property which returns the full fullpath to the backing shortcut " +
                "file."
        );
    }

    // GET Hotkey
    // ==========
    //
    // Returns a string representing the hotkey associated with
    // launching this shortcut file.
    //
    get hotkey () {
        return this.shortcut._hotkey;
    }

    // SET Hotkey
    // ==========
    //
    // Sets the hotkey key-combo.
    //
    set hotkey (combo) {
        this.shortcut._hotkey = combo;
        return combo;
    }

    // GET IconLocation
    // ================
    //
    // Gets the IconLocation, ",0" by default.
    //
    get iconlocation () {
        return this.shortcut._iconlocation;
    }

    // SET IconLocation
    // ================
    //
    // Sets the iconlocation.
    //
    set iconlocation (loc) {
        this.shortcut._iconlocation = loc;
        return loc;
    }

    // GET TargetPath
    // ==============
    //
    // Returns the path and filename to the shortcut's executable
    // file.  The value of a target path property can also include a
    // data file that's associated with an EXE.
    //
    get targetpath () {
        return this.shortcut._targetpath;
    }

    // SET TargetPath
    // ==============
    //
    // Sets the target path and filename for the shortcut's
    // executable.
    //
    set targetpath (path) {
        this.shortcut._targetpath = path;
        return path;
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
        return this.shortcut._windowstyle;
    }

    // SET WindowStyle
    // ===============
    //
    // Sets the window style of the launched application.  See the
    // table defined for GET WindowStyle for valid options.
    //
    set windowstyle (style) {

        if (typeof style !== "number") {

            if (/^-?\d+$/g.test(style)) {
                style = parseInt(style, 10);
            }
            else {
                this.context.exceptions.throw_type_mismatch(
                    "WshShortcut",
                    "Shortcut.WindowStyle property type must be numeric.",
                    "The .WindowStyle property must be numeric, or a " +
                        "string which contains only a number.  Any other " +
                        "value will throw."
                );
            }
        }

        this.shortcut._windowstyle = style;
        return style;
     }

    // GET WorkingDirectory
    // ====================
    //
    // Gets the shortcut's working directory where the launched EXE
    // will start from.
    //
    get workingdirectory () {
        return this.shortcut._workingdirectory;
    }

    // SET WorkingDirectory
    // ====================
    //
    // Sets the shortcut's working directory where the launched EXE
    // will start from.
    //
    set workingdirectory (working_dir) {
        this.shortcut._workingdirectory = working_dir;
        return working_dir;
    }

    // Save
    // ====
    //
    // The shortcut is edited in memory until Save is called.  Save
    // will write the changed shortcut .lnk file to disk.
    //
    save () {
        this.context.vfs.AddFile(this.backing_path, JSON.stringify(this.shortcut));
    }

    tostring () {
        return this.backing_path;
    }
}

module.exports = function create(context, backing_path) {
    let lnk = new JS_WshShortcut(context, backing_path);
    return proxify(context, lnk);
};
