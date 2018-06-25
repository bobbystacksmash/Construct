const Component     = require("../Component");
const proxify       = require("../proxify2");
const win32path     = require("path").win32;

class JS_DriveObject extends Component {

    constructor(context, path) {

	super(context, "Drive");

	this.context = context;
        this.ee      = this.context.emitter;
        this.vfs     = this.context.vfs;
        this._path   = path;

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
    }

    get availablespace () {
        this.ee.emit("drive.availablespace");
        return this._drive.availablespace;
    }

    get driveletter () {
        this.ee.emit("drive.driveletter");
        return this._drive.driveletter;
    }

    get drivetype () {
        this.ee.emit("drive.drivetype");
        return this._drive.drivetype;

    }

    get filesystem () {
        this.ee.emit("drive.filesystem");
        return this._drive.filesystem;
    }

    get freespace () {
        this.ee.emit("drive.freespace");
        return this._drive.freespace;
    }

    get isready () {
        this.ee.emit("drive.isready");
        return this._drive.isready;
    }

    get path () {
        this.ee.emit("drive.path");
        return this._drive.path;
    }

    get rootfolder () {
        this.ee.emit("drive.rootfolder");
        // TODO
    }

    get serialnumber () {
        this.ee.emit("drive.serialnumber");
        return this._drive.serialnumber;
    }

    get sharename () {
        this.ee.emit("drive.sharename");
        return this._drive.sharename;
    }

    get totalsize () {
        this.ee.emit("drive.totalsize");
        return this._drive.totalsize;
    }

    get volumename () {
        this.ee.emit("drive.volumename");
        return this._drive.volumename;
    }

}

module.exports = function create(context) {
    let drive = new JS_DriveObject(context);
    return proxify(context, drive);
};
