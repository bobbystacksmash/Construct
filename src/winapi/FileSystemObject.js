// https://msdn.microsoft.com/en-us/library/2z9ffy99(v=vs.84).aspx

const Component = require("../Component");
const proxify   = require("../proxify2");

class FileSystemObject extends Component {

    constructor (context) {
	super(context, "FileSystemObject");
        this.context = context;

        // Shortcuts...
        this.ee  = this.context.emitter;
        this.vfs = this.context.vfs;
    }

    //
    // PROPERTIES
    // ==========
    //

    // Returns a Drives collection consisting of all Drive objects
    // available on the local machine.
    get Drives () {}
    set Drives (_) {}

    //
    // METHODS
    // =======
    //

    // Appends a name to an existing path.  It's really just a string
    // concatenation method, rather than a filesystem method.  It does
    // not check that either path exists, or if the path is valid.
    //
    BuildPath (existing_path, new_path_part) {
        this.ee.emit("FileSystemObject::BuildPath", arguments);
        return this.vfs.BuildPath(existing_path, new_path_part);
    }

    // Copies one or more files from one location to another.
    CopyFile () {
        // TODO: Blocked on wildcard implementation.
    }

    // Recursively copies a folder from one location to another.
    CopyFolder () {
        // TODO: Blocked on wildcard implementation.
    }

    // Creates a single new folder in the `path' specified and returns
    // its Folder object.
    CreateFolder (path) {

        // Does this path already exist?
        try {
            if (this.vfs.GetFolder(path)) {
                this.context.exceptions.throw_file_already_exists(
                    "Scripting.FileSystemObject",
                    "snake",
                    "plane"
                );
            }

        }
        catch (e) {

            if (e.message.includes("Unknown volume")) {
                this.context.exceptions.throw_path_not_found(
                    "Scripting.FileSystemObject",
                    "Volume could not be found.",
                    "CreateFolder was called with a volume in a path which does " +
                        "not exist."
                );
            }

            throw e;
        }

        return this.vfs.AddFolder(path);
    }

    // Creates a specified file name and returns a TextStream object
    // that can be used to read from or write to the file.
    CreateTextFile () {

    }

    // Deletes a specified file.
    DeleteFile () {

    }

    // Deletes a specified folder and its contents.
    DeleteFolder () {

    }

    // Returns true if the specified drive exists; false if it does
    // not.
    DriveExists () {

    }

    // Returns true if a specified file exists; false if it does not.
    FileExists () {

    }

    // Returns true if a specified folder exists; false if it does
    // not.
    FolderExists (pathspec) {
        return (this.vfs.GetFolder(pathspec)) ? true : false;
    }

    // Returns a complete and unambiguous path from a provided path
    // specification.
    GetAbsolutePathName () {

    }

    // Returns a string containing the base name of the last
    // component, less any file extension, in a path.
    GetBaseName () {

    }

    // Returns a Drive object corresponding to the drive in a
    // specified path.
    GetDrive () {

    }

    // Returns a string containing the name of the drive for a
    // specified path.
    GetDriveName () {

    }

    // Returns a string containing the extension for the last
    // component in a path.
    GetExtensionName () {

    }

    // Returns a File object corresponding to the file in a specified
    // path.
    GetFile () {

    }

    // Returns the last component of specified path that is not part
    // of the drive specification.
    GetFileName () {

    }

    // Returns a Folder object corresponding to the folder in a
    // specified path.
    GetFolder (path) {

    }

    // Returns a string containing the name of the parent folder of
    // the last component in a specified path.
    GetParentFolderName () {

    }

    // Returns the special folder object specified.
    GetSpecialFolder () {

    }

    // Returns a randomly generated temporary file or folder name that
    // is useful for performing operations that require a temporary
    // file or folder.
    GetTempName () {

    }

    // Moves one or more files from one location to another.
    MoveFile () {

    }

    // Moves one or more folders from one location to another.
    MoveFolder () {

    }

    // Opens a specified file and returns a TextStream object that can
    // be used to read from, write to, or append to the file.
    OpenTextFile () {

    }
}


module.exports = FileSystemObject;
