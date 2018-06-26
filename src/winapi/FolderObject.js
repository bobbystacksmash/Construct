/*
 * "Provides access to all the properties of a folder."
 *  - https://msdn.microsoft.com/en-us/library/1c87day3(v=vs.84).aspx
 *
 */

const Component = require("../Component");
const proxify   = require("../proxify2");
const win32path = require("path").win32;
const Drive     = require("./DriveObject");
const FilesCollection = require("./FilesCollection");

class JS_FolderObject extends Component {

    constructor(context, path) {

	super(context, "Folder");

	this.context = context;
        this.ee      = this.context.emitter;
        this.vfs     = this.context.vfs;
        this._path   = path;

        if (path.toLowerCase() === "c:") {
            this._path = this.context.get_env("path");
        }

        this._assert_exists = () => {

            if (this.vfs.FolderExists(this._path)) return;

            this.context.exceptions.throw_path_not_found(
                "FolderObject",
                "The backing folder is not available.",
                "The folder which backed this object instance is " +
                    "no longer present on the filesystem (it may " +
                    "have been deleted)."
            );
        };
    }

    get attributes () {}

    // DateCreated
    // ===========
    //
    // Returns a the date and time the folder was created.
    //
    get datecreated () {
        this.ee.emit("Folder.DateCreated");

        const stats = this.vfs.Stats(this._path),
                 dt = new Date(stats.ctime);

        return dt;
    }

    // DateLastAccessed
    // ================
    //
    // Returns the date and time that the folder was last accessed.
    //
    get datelastaccessed () {
        this.ee.emit("Folder.DateLastAccessed");

        const stats = this.vfs.Stats(this._path),
                 dt = new Date(stats.atime);

        return dt;
    }

    // DateLastModified
    // ================
    //
    // Returns the date and time the folder was last modified.
    //
    get datelastmodified () {
        this.ee.emit("Folder.DateLastModified");

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
        this.ee.emit("Folder.Drive");
        return new Drive(this.context);
    }

    // Files
    // =====
    //
    // Returns a read-only FilesCollection object which contains all
    // of the files contained within the backing folder.
    //
    get files () {
        this.ee.emit("Folder.Files");
        return new FilesCollection(this.context, this._path);
    }

    // IsRootFolder
    // ============
    //
    // Returns TRUE if this folder is the root of the filesystem, or
    // FALSE otherwise.
    //
    get isrootfolder () {
        this.ee.emit("Folder.IsRootFolder");
        return this._path.toLowerCase() === "c:\\";
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
        // just returns the basename of this folder's backing path.
        return win32path.basename(this._path);
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
        return new JS_FolderObject(this.context, dirname);
    }

    // Path
    // ====
    //
    // Returns the full path which backs this Folder object, including
    // the drive designator.
    //
    get path () {
        this.ee.emit("Folder.Path");
        this._assert_exists();
        return this._path;
    }

    get shortname () {}
    get shortpath () {}
    get size () {}

    // SubFolders
    // ==========
    //
    // Returns a FoldersCollection instance which contains a realtime
    // view of the VFS.  Files which are deleted are no longer
    // accessible from the SubFolders instance.
    //
    get subfolders () {

    }


    get type () {}

    // Methods
    copy () {}
    createtextfile () {}

    // Delete
    // ======
    //
    // Deletes this folder from disk.
    //
    delete () {
        this.vfs.Delete(this._path);
    }
    move () {}
}

module.exports = function create(context, path) {
    let folder = new JS_FolderObject(context, path);
    return proxify(context, folder);
};
