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

        if (this.vfs.PathIsRelative(path)) {

            const base = win32path.basename(path),
                  dir  = win32path.dirname(path);

            if (dir === "." || dir.toLowerCase() === "c:") {
                this._path = win32path.join(this.context.get_env("path"), base);
            }
        }

        this._assert_exists = () => {
            if (this.vfs.FileExists(this._path)) return;

            this.context.exceptions.throw_file_not_found(
                "FileObject",
                "The backing file is not available.",
                "The file which backed this object instance is " +
                    "no longer present on the filesystem (it may " +
                    "have been deleted)."
            );
        };

        this._assert_exists();
    }

    // Attributes
    // ==========
    //
    // Returns a 6-bit bitmask which represents the file's attributes.
    // These values are:
    //
    // | Value | Description |
    // |-------|-------------|
    // |     1 | Read-only   |
    // |     2 | Hidden      |
    // |     4 | System      |
    // |    32 | Archive     |
    // |  1024 | Alias       |
    // |  2048 | Compressed  |
    // |_______|_____________|
    //
    //
    get attributes () {
        this.ee.emit("File.Attributes");
        this._assert_exists();

        // TODO We just return '32' because that's what the small
        // number of files I've tested on Windows seem to return.
        // Ideally, this should be revisisted and implemented
        // correctly, probably using the VFS' stats struct.
        return 32;
    }

    // DateCreated
    // ===========
    //
    // Returns a the date and time the file was created.
    //
    get datecreated () {
        this.ee.emit("File.DateCreated");
        this._assert_exists();

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
        this._assert_exists();

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
        this._assert_exists();

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
        this._assert_exists();
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

        if (win32path.dirname(this._path.toLowerCase()) === "c:\\") {
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

    get type () {
        this.ee.emit("File.Type");
        this._assert_exists();

        return this.context.get_file_association(this._path);
    }

    // Copy
    // ====
    //
    // Copies this file to another location.
    //
    copy (destination, overwrite_files) {
        this.ee.emit("File.Copy");
        this._assert_exists();

        if (typeof destination !== "string" || destination === "") {
            this.context.exceptions.throw_invalid_fn_arg(
                "FileObject",
                "Destination parameter is invalid.",
                "The destination should be a valid win32 filename."
            );
        }

        if (this.vfs.IsWildcard(destination)) {
            this.context.exceptions.throw_invalid_fn_arg(
                "FileObject",
                "Destination cannot contain wildcard characters.",
                "The destination file cannot contain wildcard characters."
            );
        }

        if (this.vfs.PathIsRelative(destination)) {

            destination = destination.replace(/^C:/i, "");
            destination = win32path.join(
                this.context.get_env("path"),
                destination
            );
        }

        if (destination.toLowerCase() === this._path.toLowerCase()) {
            this.context.exceptions.throw_permission_denied(
                "FileObject",
                "Cannot copy to destination",
                "Unable to copy this file to its destination because " +
                    "the source and destination are the same file."
            );
        }

        this.vfs.CopyFile(this._path, destination);
    }

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
