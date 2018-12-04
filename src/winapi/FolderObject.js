/*
 * "Provides access to all the properties of a folder."
 *  - https://msdn.microsoft.com/en-us/library/1c87day3(v=vs.84).aspx
 *
 */

const Component         = require("../Component");
const proxify           = require("../proxify2");
const win32path         = require("path").win32;
const FilesCollection   = require("./FilesCollection");
const FoldersCollection = require("./FoldersCollection");
const TextStream        = require("./TextStream");

function create(context, path) {

    if (path.toLowerCase() === "c:") {
        path = context.get_env("path");
    }

    function assert_exists () {

        if (context.vfs.FolderExists(path)) return;

        context.exceptions.throw_path_not_found(
            "FolderObject",
            "The backing folder is not available.",
            "The folder which backed this object instance is " +
                "no longer present on the filesystem (it may " +
                "have been deleted)."
        );
    };

    class JS_FolderObject extends Component {

        constructor(context, path) {
	    super(context, "Folder");
            assert_exists();
        }

        get attributes () {}

        // DateCreated
        // ===========
        //
        // Returns a the date and time the folder was created.
        //
        get datecreated () {
            const stats = context.vfs.Stats(path),
                  dt = new Date(stats.ctime);

            return dt;
        }

        // DateLastAccessed
        // ================
        //
        // Returns the date and time that the folder was last accessed.
        //
        get datelastaccessed () {
            const stats = context.vfs.Stats(path),
                  dt = new Date(stats.atime);

            return dt;
        }

        // DateLastModified
        // ================
        //
        // Returns the date and time the folder was last modified.
        //
        get datelastmodified () {

            const stats = context.vfs.Stats(path),
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
            // We import this here because of a cyclic dependency between
            // FolderObj<->DriveObj.
            const Drive = require("./DriveObject");
            return new Drive(context);
        }

        // Files
        // =====
        //
        // Returns a read-only FilesCollection object which contains all
        // of the files contained within the backing folder.
        //
        get files () {
            return new FilesCollection(context, path);
        }

        // IsRootFolder
        // ============
        //
        // Returns TRUE if this folder is the root of the filesystem, or
        // FALSE otherwise.
        //
        get isrootfolder () {
            return path.toLowerCase() === "c:\\";
        }

        // Name
        // ====
        //
        // Returns the folder name.
        //
        get name () {

            assert_exists();

            if (path.toLowerCase() === "c:\\") return "";


            // From analysing this on a Win7 machine, it seems that it
            // just returns the basename of this folder's backing path.
            return win32path.basename(path);
        }

        // ParentFolder
        // ============
        //
        // Returns a Folder object representing the folder that the parent
        // of the current folder.  Returns undefined if this folder is
        // already the root.
        //
        get parentfolder () {

            assert_exists();

            if (path.toLowerCase() === "c:\\") {
                return undefined;
            }

            const dirname = win32path.dirname(path);
            console.log("DIRNAME", path, dirname);
            return create(context, dirname);
        }

        // Path
        // ====
        //
        // Returns the full path which backs this Folder object, including
        // the drive designator.
        //
        get path () {
            assert_exists();
            return path;
        }

        // ShortName
        // =========
        //
        // Returns a DOS 8.3 folder name without the folders path.
        //
        get shortname () {
            assert_exists();

            return context.vfs.GetShortName(path);
        }

        // ShortPath
        // =========
        //
        // Returns the complete path to a folder in DOS 8.3 format
        // (shortnames).
        //
        get shortpath () {
            assert_exists();

            const shortpath = context.vfs.ShortPath(path);

            if (shortpath.toLowerCase() === path.toLowerCase()) {
                return path;
            }

            return shortpath;
        }

        get self () {
            return context.get_instance_by_id(this.__id__);
        }

        // Size
        // ====
        //
        // Returns the total size of all files, subfolders, and their
        // contents in the folder structure, starting with the backing
        // folder.
        //
        // Throws a 'permission denied' error if the folder is the root
        // folder.
        //
        get size () {
            assert_exists();

            if (path.toLowerCase() === "c:\\") {
                context.exceptions.throw_permission_denied(
                    "FolderObject",
                    "Cannot get .Size of root folder.",
                    "The current folder is the file system's root, and it is " +
                        "not possible to request the .Size of this folder."
                );
            }

            return context.vfs.FolderContentsSize(path);
        }

        // SubFolders
        // ==========
        //
        // Returns a FoldersCollection instance which contains a realtime
        // view of the VFS.  Files which are deleted are no longer
        // accessible from the SubFolders instance.
        //
        get subfolders () {
            assert_exists();

            return new FoldersCollection(context, path);
        }

        // Type
        // ====
        //
        // For FolderObject instances, always returns 'File folder'.
        //
        get type () {
            assert_exists();
            return "File folder";
        }

        // ###########
        // # Methods #
        // ###########

        // Copy
        // ====
        //
        // Recursively copies the backing folder, and all of its sub files
        // and folders to `destination'.  If `overwrite_files' is set to TRUE,
        // files which already exist in `destination' will be overwritten.
        //
        // The destination path is not relative to `path' but rather
        // the CWD of the [cw]script process which launched it.
        //
        copy (destination, overwrite_files) {
            assert_exists();

            if (context.vfs.IsWildcard(destination)) {
                context.exceptions.throw_invalid_fn_arg(
                    "FolderObject",
                    "Destination cannot contain wildcard characters.",
                    "The destination folder cannot contain wildcard characters."
                );
            }

            // Unlike FSO.Copy, there is no difference with this Copy
            // method if destination ends with or without a trailing
            // separator, so strip it.
            destination = destination.replace(/[\\/]*$/, "");

            if (context.vfs.PathIsRelative(destination)) {
                destination = win32path.join(context.get_env("path"), destination);
            }

            if (! context.vfs.FolderExists(destination)) {
                context.vfs.AddFolder(destination);
            }

            try {
                context.vfs.CopyFolder(`${path}\\`, destination, overwrite_files);
            }
            catch (e) {

                if (e.message.includes("destination file already exists")) {
                    context.exceptions.throw_file_already_exists(
                        "FolderObject",
                        "Copy cannot overwrite existing file when overwrite = false.",
                        "Unable to overwrite existing file because the overwrite_files " +
                            "flag is set to FALSE.  Either change the flag to TRUE or " +
                            "remove the existing file."
                    );
                }

                throw e;
            }
        }

        // CreateTextFile
        // ==============
        //
        // Given a filename (with optional path), creates a text file and
        // returns an opened TextStream object.
        //
        //
        createtextfile (filepath, overwrite, unicode) {

            assert_exists();

            if (overwrite === undefined || overwrite === null) overwrite = true;
            if (unicode   === undefined || unicode   === null) unicode   = false;

            if (context.vfs.IsWildcard(filepath)) {
                context.exceptions.throw_invalid_fn_arg(
                    "FolderObject",
                    "Destination cannot contain wildcard characters.",
                    "The destination folder cannot contain wildcard characters."
                );
            }

            if (context.vfs.PathIsRelative(filepath)) {
                filepath = win32path.join(path, filepath);
            }

            if (overwrite === false && context.vfs.FileExists(filepath)) {
                context.exceptions.throw_file_already_exists(
                    "FolderObject",
                    "The File you are trying to write already exists.",
                    "Cannot create text file because the file already exists and " +
                        "the overwrite flag is false (meaning do not overwrite)."
                );
            }

            const CANNOT_READ = false,
                  WRITE_MODE  = 1,
                  CAN_WRITE   = true,
                  PERSIST     = true;

            try {

                if (overwrite) {
                    context.vfs.AddFile(filepath);
                }

                var textstream  = new TextStream(
                    context,
                    filepath,
                    CANNOT_READ,
                    WRITE_MODE,
                    unicode,
                    PERSIST
                );
            }
            catch (e) {

                context.exceptions.throw_bad_filename_or_number(
                    "FolderObject",
                    "Filepath contains illegal characters.",
                    "The filename contains at least one illegal character " +
                        "which is preventing the file from being created."
                );
            }

            // TODO: what if the file already exists?
            return textstream;
        }

        // Delete
        // ======
        //
        // Deletes this folder and all contents (recursively).
        //
        delete () {
            assert_exists();
            context.vfs.Delete(path);
        }

        // Move
        // ====
        //
        // Moves this folder to `destination', relative to the CWD.
        //
        move (destination) {
            assert_exists();

            if (arguments.length > 1) {
                context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                    "FolderObject",
                    "Folder.Move only accepts one parameter.",
                    "Ensure that exactly one parameter (path) is given to " +
                        "Folder.Move."
                );
            }

            if (context.vfs.IsWildcard(destination)) {
                context.exceptions.throw_invalid_fn_arg(
                    "FolderObject",
                    "Destination cannot contain wildcard characters.",
                    "The destination folder cannot contain wildcard characters."
                );
            }

            // Unlike FSO.Copy, there is no difference with this Copy
            // method if destination ends with or without a trailing
            // separator, so strip it.
            destination = destination.replace(/[\\/]*$/, "");

            if (context.vfs.PathIsRelative(destination)) {
                destination = win32path.join(context.get_env("path"), destination);
            }

            if (context.vfs.FolderExists(destination)) {
                context.exceptions.throw_file_already_exists(
                    "FolderObject",
                    "Destination file exists.",
                    "A file in the destination already exists."
                );
            }

            try {
                context.vfs.MoveFolder(path, destination);
                path = destination;
            }
            catch (e) {

                if (e.message.includes("destination file already exists")) {
                    context.exceptions.throw_file_already_exists(
                        "FolderObject",
                        "Destination file exists.",
                        "A file in the destination already exists."
                    );
                }

                throw e;
            }
        }

        // toString
        // ========
        //
        // Returns a string representation of this class.
        //
        tostring () {
            return path;
        }

        valueof () {
            return path;
        }
    }

    let folder = new JS_FolderObject(context, path);
    return proxify(context, folder);
};

module.exports = create;
