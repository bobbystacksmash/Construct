const Component     = require("../Component");

const proxify       = require("../proxify2");
const win32path     = require("path").win32;

class JS_DriveObject extends Component {

    constructor(context, drive) {

	super(context, "Drive");

	this.context = context;
        this.ee      = this.context.emitter;
        this.vfs     = this.context.vfs;

        if (drive === undefined) drive = "c";
        drive = drive.toLowerCase();

        if (/^[abd-z]:?$/.test(drive) || /^[abd-z]:[\\/]$/.test(drive)) {
            this.context.exceptions.throw_device_unavailable(
                "DriveObject",
                `The drive } cannot be found.`,
                `The requested drive letter (${drive}) cannot be found.`
            );
        }

        // Here are some defaults -- these should be overriden someday.
        this._drive = {
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

        this._throw_read_only = function (prop) {
            this.context.exceptions.throw_invalid_fn_arg(
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
        this.ee.emit("drive.availablespace");
        return this._drive.availablespace;
    }

    set driveletter (x) { this._throw_read_only("driveletter"); }
    get driveletter () {
        this.ee.emit("drive.driveletter");
        return this._drive.driveletter;
    }

    set drivetype (x) { this._throw_read_only("drivetype"); }
    get drivetype () {
        this.ee.emit("drive.drivetype");
        return this._drive.drivetype;

    }

    set filesystem (x) { this._throw_read_only("filesystem"); }
    get filesystem () {
        this.ee.emit("drive.filesystem");
        return this._drive.filesystem;
    }

    set freespace (x) { this._throw_read_only("freespace"); }
    get freespace () {
        this.ee.emit("drive.freespace");
        return this._drive.freespace;
    }

    set isready (x) { this._throw_read_only("isready"); }
    get isready () {
        this.ee.emit("drive.isready");
        return this._drive.isready;
    }

    set path (x) { this._throw_read_only("path"); }
    get path () {
        this.ee.emit("drive.path");
        return this._drive.path;
    }

    set rootfolder (x) { this._throw_read_only("rootfolder"); }
    get rootfolder () {
        this.ee.emit("drive.rootfolder");
        // We import this here because of a cyclic dependency between
        // FolderObj<->DriveObj.
        const FolderObject  = require("./FolderObject");
        return new FolderObject(this.context, "C:\\");
    }

    set serialnumber (x) { this._throw_read_only("serialnumber"); }
    get serialnumber () {
        this.ee.emit("drive.serialnumber");
        return this._drive.serialnumber;
    }

    set sharename (x) { this._throw_read_only("sharename"); }
    get sharename () {
        this.ee.emit("drive.sharename");
        return this._drive.sharename;
    }

    set totalsize (x) { this._throw_read_only("totalsize"); }
    get totalsize () {
        this.ee.emit("drive.totalsize");
        return this._drive.totalsize;
    }

    set volumename (x) { this._throw_read_only("volumename"); }
    get volumename () {
        this.ee.emit("drive.volumename");
        return this._drive.volumename;
    }
}

module.exports = function create(context, drive_letter) {
    let drive = new JS_DriveObject(context, drive_letter);
    return proxify(context, drive);
};
