const Component     = require("../Component");

const proxify       = require("../proxify2");
const win32path     = require("path").win32;

function create(context, drive_letter) {

    let _drive = {
        availablespace: 112002224128,
        driveletter: "C",
        drivetype: 2,
        filesystem: "NTFS",
        freespace: 112002224128,
        isready: true,
        path: "C:",
        rootfolder: null,
        serialnumber: -521334312,
        sharename: "",
        totalsize: 136256155648,
        volumename: ""
    };

    class JS_DriveObject extends Component {

        constructor(context, drive) {

	    super(context, "Drive");

            if (drive === undefined) drive = "c";
            drive = drive.toLowerCase();

            if (/^[abd-z]:?$/.test(drive) || /^[abd-z]:[\\/]$/.test(drive)) {
                context.exceptions.throw_device_unavailable(
                    "DriveObject",
                    `The drive } cannot be found.`,
                    `The requested drive letter (${drive}) cannot be found.`
                );
            }

            // Here are some defaults -- these should be overriden someday.
            this._throw_read_only = function (prop) {
                context.exceptions.throw_invalid_fn_arg(
                    "Drive",
                    "Write attempted to read-only property.",
                    `The ${prop} property is read-only.  Attempting to ` +
                        "assign to this property has caused this exception " +
                        "to be thrown.  The Drive object cannot be written " +
                        "to."
                );
            };
        }

        set availablespace (x) { this._throw_read_only("availablespace"); }
        get availablespace () {
            return _drive.availablespace;
        }

        set driveletter (x) { this._throw_read_only("driveletter"); }
        get driveletter () {
            return _drive.driveletter;
        }

        set drivetype (x) { this._throw_read_only("drivetype"); }
        get drivetype () {
            return _drive.drivetype;

        }

        set filesystem (x) { this._throw_read_only("filesystem"); }
        get filesystem () {
            return _drive.filesystem;
        }

        set freespace (x) { this._throw_read_only("freespace"); }
        get freespace () {
            return _drive.freespace;
        }

        set isready (x) { this._throw_read_only("isready"); }
        get isready () {
            return _drive.isready;
        }

        set path (x) { this._throw_read_only("path"); }
        get path () {
            return _drive.path;
        }

        set rootfolder (x) { this._throw_read_only("rootfolder"); }
        get rootfolder () {
            // We import this here because of a cyclic dependency between
            // FolderObj<->DriveObj.
            const FolderObject  = require("./FolderObject");
            return new FolderObject(context, "C:\\");
        }

        set serialnumber (x) { this._throw_read_only("serialnumber"); }
        get serialnumber () {
            return _drive.serialnumber;
        }

        set sharename (x) { this._throw_read_only("sharename"); }
        get sharename () {
            return _drive.sharename;
        }

        set totalsize (x) { this._throw_read_only("totalsize"); }
        get totalsize () {
            return _drive.totalsize;
        }

        set volumename (x) { this._throw_read_only("volumename"); }
        get volumename () {
            return _drive.volumename;
        }
    }


    let drive = new JS_DriveObject(context, drive_letter);
    return proxify(context, drive);
};

module.exports = create;
