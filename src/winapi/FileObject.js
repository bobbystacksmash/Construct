const Component  = require("../Component");
const proxify    = require("../proxify2");
const win32path  = require("path").win32;
const Drive      = require("./DriveObject");
const TextStream = require("./TextStream");

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
                    "have been deleted).  The original backing file was: " +
                    this._path
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
    // Returns the file name.
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

        // We require `Folder' here to avoid issues surrounding cyclic
        // dependencies.
        const Folder = require("./FolderObject");

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
    copy (destination, overwrite) {
        this.ee.emit("File.Copy");
        this._assert_exists();

        if (overwrite === undefined || overwrite === null) {
            overwrite = true;
        }

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

            if (destination.endsWith("/") || destination.endsWith("\\")) {
                // The copy expression is something like: "../", which
                // is legal.
                destination = win32path.join(destination, this.name);
            }
        }

        if (destination.toLowerCase() === this._path.toLowerCase()) {
            this.context.exceptions.throw_permission_denied(
                "FileObject",
                "Cannot copy to destination",
                "Unable to copy this file to its destination because " +
                    "the source and destination are the same file."
            );
        }

        if (this.vfs.FolderExists(destination)) {
            this.context.exceptions.throw_permission_denied(
                "FileObject",
                "Destination copy name matches existing folder name.",
                "A folder exists in the destination with the same name " +
                    "as the filename."
            );
        }

        if (this.vfs.FileExists(destination) && overwrite === false) {
            this.context.exceptions.throw_file_already_exists(
                "FileObject",
                "Destination file already exists.",
                "Overwrtiting has been disabled, and the destination file " +
                    "already exists."
            );
        }

        this.vfs.CopyFile(this._path, destination);
    }

    // Delete
    // ======
    //
    // Deletes this file from disk.
    //
    delete () {
        this.ee.emit("File.Delete");
        this._assert_exists();
        this.vfs.Delete(this._path);
    }

    // Move
    // ====
    //
    // Moves this file to another location.
    //
    move (destination) {
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

            if (destination.endsWith("/") || destination.endsWith("\\")) {
                // The copy expression is something like: "../", which
                // is legal.
                destination = win32path.join(destination, this.name);
            }
        }

        if (destination.toLowerCase() === this._path.toLowerCase()) {
            return;
        }

        if (this.vfs.FolderExists(destination)) {
            this.context.exceptions.throw_permission_denied(
                "FileObject",
                "Destination copy name matches existing folder name.",
                "A folder exists in the destination with the same name " +
                    "as the filename."
            );
        }

        if (this.vfs.FileExists(destination)) {
            this.context.exceptions.throw_file_already_exists(
                "FileObject",
                "Destination file already exists.",
                "Overwrtiting has been disabled, and the destination file " +
                    "already exists."
            );
        }

        this.vfs.MoveFile(this._path, destination);
        this._path = destination;
    }

    // OpenAsTextStream
    // ================
    //
    // Opens the given text file for reading or writing.
    //
    // IO Modes:
    //
    //   | Value | Mnemonic | Description                             |
    //   |-------|----------|-----------------------------------------|
    //   |   1   |   Read   | Open file for reading only (no writes). |
    //   |   2   |   Write  | Write only. All content is overwritten. |
    //   |   8   |  Append  | Appends to existing file contents.      |
    //
    //
    // Formats:
    //   | Value | Open As  | Description                                 |
    //   |-------|----------|---------------------------------------------|
    //   |   0   |  ASCII   | Open the file in ASCII mode.                |
    //   |  -1   |  Unicode | Open the file in Unicode mode.              |
    //   |  -2   |  Default | Open the file in the system's default mode. |
    //
    openastextstream (iomode, format) {

        const IO_MODE = {
            read:   1,
            write:  2,
            append: 8
        };

        const FORMAT = {
            ascii:    0,
            unicode: -1,
            default: -2
        };

        // Defaults
        if (iomode === undefined || iomode === null) {
            iomode = IO_MODE.read;
        }

        if (format === undefined || format === null) {
            format = FORMAT.ascii;
        }

        let throw_invalid_fn_arg = function () {
            this.context.exceptions.throw_invalid_fn_arg(
                "FileObject",
                "Invalid argument passed to #OpenAsTextStream.",
                "Invalid argument passed to #OpenAsTextStream.",
            );
        }.bind(this);

        // We translate the `iomode' and `format' inputs in to
        // something our `TextStream' object will accept. The
        // `TextStream' constructor needs to be given:
        //
        //  backing_stream_spec --> this._path
        //  can_read            --> derive from iomode
        //  write_mode          --> derive from iomode
        //  use_unicode         --> derive from format
        //  persist             --> need to test in Win VM
        //
        let ts_args = {
            can_read: null,
            write_mode: null,
            use_unicode: null,
            persist: true
        };

        switch (iomode) {
        case IO_MODE.read:
            ts_args.write_mode = 0;
            ts_args.can_read   = true;
            break;

        case IO_MODE.write:
            ts_args.write_mode = 1;
            ts_args.can_read   = false;
            break;

        case IO_MODE.append:
            ts_args.write_mode = 2;
            ts_args.can_read   = false;
            break;
        default:
            throw_invalid_fn_arg();
        }

        switch (format) {
        case FORMAT.ascii:
        case FORMAT.default:
            ts_args.use_unicode = false;
            break;

        case FORMAT.unicode:
            ts_args.use_unicode = true;
            break;

        default:
            throw_invalid_fn_arg();
        }

        return new TextStream(
            this.context,
            this._path,
            ts_args.can_read,
            ts_args.write_mode,
            ts_args.use_unicode,
            ts_args.persist
        );
    }

}

module.exports = function create(context, path) {
    let folder = new JS_FileObject(context, path);
    return proxify(context, folder);
};
