const Component = require("../Component");
const proxify   = require("../proxify2");
const win32path = require("path").win32;
const Drive     = require("./DriveObject");
const Folder    = require("./FolderObject");

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

        const dirname  = win32path.dirname(this._path),
              new_path = `${dirname}\\${new_name}`;

        if (this.vfs.FileExists(new_path)) {
            this.context.exceptions.throw_file_already_exists(
                "FileObject",
                "Cannot rename this file - the destination file already exists.",
                "This file object cannot be renamed because there already exists " +
                    "a file with this name."
            );
        }

        // try/catch this!
        this.vfs.Rename(this._path, new_path);
        this._path = new_path;
    }


    // ParentFolder
    // ============
    //
    // Returns a Folder object representing the folder that the parent
    // of the current folder.  Returns undefined if this folder is
    // already the root.
    //
    get parentfolder () {

        this._assert_exists();

        if (this._path.toLowerCase() === "c:\\") {
            return undefined;
        }

        const dirname = win32path.dirname(this._path);
        return new Folder(this.context, dirname);
    }

    // Path
    // ====
    //
    // Returns the full path which backs this Folder object, including
    // the drive designator.
    //
    get path () {
        this.ee.emit("File.Path");
        this._assert_exists();
        return this._path;
    }

    // ShortName
    // =========
    //
    // Returns this file's name in DOS 8.3 format.
    //
    get shortname () {
        this.ee.emit("File.ShortName");
        this._assert_exists();

        return this.vfs.GetShortName(this._path);
    }

    // ShortPath
    // =========
    //
    // Returns the complete path to a folder in DOS 8.3 format
    // (shortnames).
    //
    get shortpath () {
        this.ee.emit("File.ShortPath");
        this._assert_exists();

        const shortpath = this.vfs.ShortPath(this._path);

        if (shortpath.toLowerCase() === this._path.toLowerCase()) {
            return this._path;
        }

        return shortpath;
    }

    // Size
    // ====
    //
    // Returns the size of the file in bytes.
    //
    get size () {
        this.ee.emit("File.Size");
        this._assert_exists();

        return this.vfs.GetFileSize(this._path);
    }

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
