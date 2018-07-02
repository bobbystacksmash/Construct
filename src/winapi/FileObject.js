const Component = require("../Component");
const proxify   = require("../proxify2");
const win32path = require("path").win32;

class JS_FileObject extends Component {

    constructor(context, path) {

	super(context, "File");

	this.context = context;
        this.ee      = this.context.emitter;
        this.vfs     = this.context.vfs;
        this._path   = path;

        this._assert_exists = () => {
            if (this.vfs.FileExists(this._path)) return;

            this.context.exceptions.throw_path_not_found(
                "FileObject",
                "The backing file is not available.",
                "The file which backed this object instance is " +
                    "no longer present on the filesystem (it may " +
                    "have been deleted)."
            );
        };
    }

    get attributes () {}

    // DateCreated
    // ===========
    //
    // Returns a the date and time the file was created.
    //
    get datecreated () {
        this.ee.emit("File.DateCreated");

        const stats = this.vfs.Stats(this._path),
                 dt = new Date(stats.ctime);

        return dt;
    }

    // DateLastAccessed
    // ================
    //
    // Returns the date and time that the file was last accessed.
    //
    get datelastaccessed () {
        this.ee.emit("File.DateLastAccessed");

        const stats = this.vfs.Stats(this._path),
                 dt = new Date(stats.atime);

        return dt;
    }

    // DateLastModified
    // ================
    //
    // Returns the date and time the file was last modified.
    //
    get datelastmodified () {
        this.ee.emit("File.DateLastModified");

        const stats = this.vfs.Stats(this._path),
                 dt = new Date(stats.mtime);

        return dt;
    }

    // Drive
    // =====
    //
    // Returns a read-only Drive object, which contains about the
    // drive upon which this folder exists.  As we don't support
    // multiple drives, the Drive is always C:\.
    //
    get drive () {
        this.ee.emit("File.Drive");

        return new Drive(this.context);
    }

    // Name
    // ====
    //
    // Returns the folder name.
    //
    get name () {

        this._assert_exists();

        if (this._path.toLowerCase() === "c:\\") return this._path;

        // From analysing this on a Win7 machine, it seems that it
        // just returns the basename of this file's backing path.
        return win32path.basename(this._path);
    }

    // [set] Name
    // ==========
    //
    // Renames the current backing file to be the new name.
    //
    set name (new_name) {

        this._assert_exists();

        // todo - how do we handle the root volume?

        const dirname  = win32path.dirname(this._path),
              new_path = `${dirname}\\${new_name}`;

        // try/catch this!
        this.vfs.Rename(this._path, new_path);
        this._path = new_path;
    }

    get parentfolder () {}
    get path () {}
    get shortname () {}
    get shortpath () {}
    get size () {}

    get type () {}

    // Methods

    copy () {}

    // Delete
    // ======
    //
    // Deletes this folder from disk.
    //
    delete () {
        this.vfs.Delete(this._path);
    }

    move () {}

    openastextstream () {

    }

}

module.exports = function create(context, path) {
    let folder = new JS_FileObject(context, path);
    return proxify(context, folder);
};
