const Component           = require("../Component");
const proxify             = require("../proxify2");
const FSOHelper           = require("../absFileSystemObject");
const JS_TextStream       = require("./TextStream");
const JS_Folder           = require("./FolderObject");
const JS_File             = require("./FileObject");
const JS_Drive            = require("./DriveObject");
const JS_DrivesCollection = require("./DrivesCollection");
const win32path           = require("path").win32;

class JS_FileSystemObject extends Component {

    constructor (context) {

	super(context, "FileSystemObject");
        this.context = context;

        // Shortcuts...
        this.ee  = this.context.emitter;
        this.vfs = this.context.vfs;

        this.throw_file_not_found = function (reason) {
            this.context.exceptions.throw_file_not_found(
                "FileSystemObject",
                "Cannot find file.",
                reason
            );
        }.bind(this);

    }

    //
    // PROPERTIES
    // ==========
    //

    // Returns a Drives collection consisting of all Drive objects
    // available on the local machine.
    get drives () {
        this.ee.emit("FileSystemObject.Drives");
        return new JS_DrivesCollection(this.context);
    }

    set drives (_) {

        this.context.exceptions.throw_unsupported_prop_or_method(
            "FileSystemObject",
            "Cannot assign to the '.drives' property.",
            "The '.drives' property does not support assignment and is " +
                "read-only."
        );
    }

    //
    // METHODS
    // =======
    //

    // Appends a name to an existing path.  It's really just a string
    // concatenation method, rather than a filesystem method.  It does
    // not check that either path exists, or if the path is valid.
    //
    buildpath (existing_path, new_path_part) {
        this.ee.emit("FileSystemObject.BuildPath", existing_path, new_path_part);
        return this.vfs.BuildPath(existing_path, new_path_part);
    }

    // Copies one or more files from one location to another.
    copyfile (source, destination, overwrite_files) {

        this.ee.emit("FileSystemObject.CopyFile", source, destination, overwrite_files);

        source      = this.vfs.Resolve(source);
        destination = this.vfs.Resolve(destination);

        const copy_into_dest_dir = (/[/\\]$/.test(destination)),
              source_dirname     = win32path.dirname(source),
              source_basename    = win32path.basename(source),
              dest_dirname       = win32path.dirname(destination),
              dest_basename      = win32path.basename(destination),
              is_source_wildcard = (/["*?<>]/g.test(source_basename));

        //
        // The FSO supports many different path types.  The only one
        // it doesn't seem to support are paths which contain
        // environment variables.
        //
        let copy_from_to = [
            {
                source: source,
                dest:  (copy_into_dest_dir) ?
                    `${destination}\\${source_basename}` : destination
            }
        ];

        if (is_source_wildcard) {

            let matched_file_list = this.vfs.FindFiles(source_dirname, source_basename);

            if (matched_file_list.length === 0) {
                this.context.exceptions.throw_file_not_found(
                    "Scripting.FileSystemObject",
                    "Unable to complete 'CopyFile', as the wildcard does not " +
                        "match any files.",
                    "No files were matched by the wildcard expression, " +
                        "meaning nothing can be copied.  Update/fix the " +
                        "wildcard and retry."
                );
            }

            copy_from_to = matched_file_list.map(file => {
                return {
                    source: `${source_dirname}\\${file}`,
                    dest:   `${destination}\\${file}`
                };
            });
        }

        try {

            for (let i = 0; i < copy_from_to.length; i++) {
                this.vfs.CopyFile(copy_from_to[i].source, copy_from_to[i].dest);
            }
        }
        catch (e) {

            if (e.message.includes("EISDIR")) {
                this.context.exceptions.throw_permission_denied(
                    "Scripting.FileSystemObject",
                    "Cannot copy to destination because the destination " +
                        "filename is ambiguous.",
                    "This error indicates that a file-copy operation has not " +
                        "succeeded due to a name-collision in the " +
                        "destination.  For example, if the destination of a " +
                        "copy is the filename 'foo', yet a folder exists in " +
                        "the same location also named 'foo', this error is " +
                        "thrown."
                );
            }
            else if (e.message.includes("ENOENT")) {

                if (e.message.includes(`${source_basename}`)) {
                    this.context.exceptions.throw_file_not_found(
                        "Scripting.FileSystemObject",
                        "Unable to find src file.",
                        "The CopyFile operation was not completely successful " +
                            `because the file: ${source} could not be found.`
                    );
                }
                else {
                    this.context.exceptions.throw_path_not_found(
                        "Scripting.FileSystemObject",
                        "Unable to find destination folder.",
                        "The CopyFile operation was not completely successful " +
                            `because the destination folder: ${destination} ` +
                            "could not be found."
                    );
                }
            }
            else {
                throw e;
            }
        }
    }

    // CopyFolder
    // ==========
    //
    // Recursively copies all folders matching the wildcard pattern
    // from SOURCE in to DESTINATION.
    //
    copyfolder (source, destination, overwrite) {

        source      = this.vfs.Resolve(source);
        destination = this.vfs.Resolve(destination);

        if (source.toLowerCase() === destination.toLowerCase()) return;

        const src_basename = win32path.basename(source),
              src_dirname  = win32path.dirname(source),
              dst_basename = win32path.basename(destination),
              dst_dirname  = win32path.dirname(destination);

        if (this.vfs.IsWildcard(src_dirname)){
            this.context.exceptions.throw_invalid_fn_arg(
                "Scripting.FileSystemObject",
                "Source path (excluding last name part) cannot contain wildcards.",
                "Wildcards may only appear as the very lat item in a path string, " +
                    "and cannot appear anywhere else."
            );
        }

        if (this.vfs.IsWildcard(dst_basename) || this.vfs.IsWildcard(dst_dirname)) {
            this.context.exceptions.throw_invalid_fn_arg(
                "Scripting.FileSystemObject",
                "Destination paths cannot contain wildcard characters",
                "The copy-to destination cannot contain any wildcard characters."
            );
        }

        const dir_items_list = (this.vfs.IsWildcard(src_basename))
                  ? this.vfs.FindFolders(src_dirname, src_basename)
                  : [src_basename];

        for (let i = 0; i < dir_items_list.length; i++) {

            let dir_name = dir_items_list[i],
                src_path = `${src_dirname}\\${dir_name}`;

            try {
                this.vfs.CopyFolder(src_path, destination, overwrite);
            }
            catch (e) {

                if (e.message.includes("source and destination are eq")) {
                    this.context.exceptions.throw_invalid_fn_arg(
                        "Scripting.FileSystemObject",
                        "A CopyFolder operation has tried to copy in to itself.",
                        "This error is thrown when a copy operation is attempting to " +
                            "copy a path in to itself.  All files copied up to this point " +
                            "will remain, but no more files will be copied."
                    );
                }
                else if (e.message.includes("destination file already exists")) {
                    this.context.exceptions.throw_file_already_exists(
                        "Scripting.FileSystemObject",
                        "Cannot overwrite existing file with same name when overwrite=false.",
                        "When copying, if 'overwrite=false', destination files which exist " +
                            "in the source shall not be overwritten."
                    );
                }

                throw e;
            }
        }
    }

    // CreateFolder
    // ============
    //
    // Creates a folder at `path'.  If `path' is a relative path, it
    // is considered relative to the CWD of the process.
    //
    // Throws a 'file not found' exception if the folder already exists.
    //
    createfolder (path) {
        this.ee.emit("FileSystemObject.CreateFolder");

        if (path === null) {
            this.context.exceptions.throw_type_mismatch(
                "FileSystemObject",
                "Cannot pass 'null' to #CreateFolder.",
                "The path specified has been evaluated to 'null', which cannot " +
                    "be translated in to a valid foldername."
            );
        }

        if (typeof path !== "string") {
            try {
                path = path.toString();
            }
            catch (e) {
                path = "";
            }
        }

        const invalid_arg = [
            path === undefined,
            path === "",
            path instanceof Array,
            this.vfs.IsWildcard(path),
            this.vfs.IsPathIllegal(path)
        ].some(x => x === true);

        if (invalid_arg) {
            this.context.exceptions.throw_invalid_fn_arg(
                "FileSystemObject",
                "Cannot create folder using given parameter.",
                "The provided parameter cannot be used as a valid foldername."
            );
        }

        if (this.vfs.PathIsRelative(path)) {
            path = win32path.join(this.context.get_env("path"), path);
        }

        if (this.vfs.FolderExists(path)) {
            this.context.exceptions.throw_file_already_exists(
                "Scripting.FileSystemObject",
                "Cannot create folder because it already exists.",
                "The folder cannot be created because it already exists."
            );
        }

        path = "" + path;

        this.vfs.AddFolder(path);
        return new JS_Folder(this.context, path);
    }

    // CreateTextFile
    // ==============
    //
    // Creates a specified file name and returns a TextStream object
    // that can be used to read from or write to the file.
    createtextfile (filespec, overwrite, unicode) {

        if (overwrite === undefined || overwrite === null) {
            overwrite = false;
        }

        if (unicode === undefined || unicode === null) {
            unicode = false;
        }

        if (this.vfs.IsWildcard(filespec)) {
            this.context.exceptions.throw_bad_filename_or_number(
                "FileSystemObject",
                "The given filepath must not contain wildcards.",
                "Ensure that the supplied filepath does not contain " +
                    "wildcard symbols."
            );
        }

        if (this.vfs.PathIsRelative(filespec)) {
            filespec = filespec.replace(/^C:/i, "");
            filespec = win32path.join(this.context.get_env("path"), filespec);
        }

        const dirname  = win32path.dirname(filespec),
              filename = win32path.basename(filespec);

        if (this.vfs.FolderExists(dirname) === false) {
            this.context.exceptions.throw_path_not_found(
                "FileSystemObject",
                "Cannot create text file in a path which does not exist.",
                "The CreateTextFile method will not automatically create " +
                    "the path to the text file."
            );
        }

        try {

            let file_parts = FSOHelper.Parse(filespec),
                cwd        = this.context.get_env("Path");

            if (file_parts.dir === "") {
                file_parts = FSOHelper.Parse(`${cwd}\\${file_parts.base}`);
            }
            else if (file_parts.root === "") {

                // This is a relative path...
                let relative_path = win32path.join(cwd, filespec);
                file_parts = FSOHelper.Parse(relative_path);
            }

            FSOHelper.ThrowIfInvalidPath(file_parts.base, { file: true });
            FSOHelper.ThrowIfInvalidPath(file_parts.orig_path);

            // TODO: there is code missing here -- need overwrite mode stuff.
            //
            // This will throw if auto-vivification is disabled:

            if (overwrite === false && this.context.vfs.FileExists(file_parts.orig_path)) {
                this.context.exceptions.throw_file_already_exists(
                    "Scripting.FileSystemObject",
                    "Cannot create file while Overwrite is false",
                    "Unable to create a textfile which already exists on " +
                        "disk while the Overwrite property is set to false."
                );
            }

            return new JS_TextStream(
                this.context,
                file_parts.orig_path,
                false, // CAN READ?   No.
                1,
                unicode
            );
        }
        catch (e) {

            if (e.message.includes("contains invalid characters")) {
                this.context.exceptions.throw_bad_filename_or_number(
                    "Scripting.FileSystemObject",
                    "Cannot create file -- illegal chars in filename.",
                    "The file cannot be created because it contains illegal characters " +
                        "which are forbidden in Windows filenames."
                );
            }
            else if (e.message.includes("path does not exist and autovivify disabled")) {
                this.context.exceptions.throw_path_not_found(
                    "Scripting.FileSystemObject",
                    "Cannot create the requested file because the parent path does not exist.",
                    "By default, Construct allows path 'autovivification' which will auto-create " +
                        "folder paths if they do not exist.  This error is seen because a path " +
                        "create event was attempted, but the path does not exist and autovivify " +
                        "is disabled."
                );
            }

            throw e;
        }
    }

    // Deletes a specified file.
    deletefile (filespec, force) {
        this.ee.emit("FileSystemObject.DeleteFile");

        let path    = win32path.dirname(filespec),
            pattern = win32path.basename(filespec);

        if (this.vfs.IsWildcard(path) || this.vfs.IsFilespecIllegal(pattern)) {
            this.context.exceptions.throw_bad_filename_or_number(
                "FileSystemObject",
                "No files match the delete expression.",
                "There are no files which match the delete expression."
            );
        }

        if (this.vfs.PathIsRelative(path)) {
            path = path.replace(/^C:/i, "");
            path = win32path.join(this.context.get_env("path"), path);
        }

        if (this.vfs.FolderExists(filespec)) return 0;

        let num_deleted = this.vfs.DeleteInFolderMatching(path, pattern);

        if (num_deleted === 0) {
            this.context.exceptions.throw_file_not_found(
                "FileSystemObject",
                "Unable to delete: no files found.",
                "No files were found which match the pattern expression."
            );
        }

        return num_deleted;
    }

    // Deletes a specified folder and its contents.
    deletefolder (pathspec) {
        this.ee.emit("FileSystemObject.DeleteFolder");

        let path    = win32path.dirname(pathspec),
            pattern = win32path.basename(pathspec);

        if (/[\\/]+$/.test(path)) {
            this.context.exceptions.throw_invalid_fn_arg(
                "FileSystemObject",
                "DeleteFolder paths cannot end in trailing slashes.",
                "The DeleteFolder path ended with either '\\' or '/', neither " +
                    "of which are allowed."
            );
        }

        if (this.vfs.IsWildcard(path)) {
            this.context.exceptions.throw_bad_filename_or_number(
                "FileSystemObject",
                "Cannot use wildcards in the route-to the folder.",
                "Wildcard usage is not permitted in the path leading to the " +
                    "folder to be deleted."
            );
        }

        if (this.vfs.PathIsRelative(path)) {
            path = path.replace(/^C:/i, "");
            path = win32path.join(this.context.get_env("path"), path);
        }

        let num_deleted = this.vfs.DeleteInFolderMatching(
            path, pattern, { files: false, folders: true}
        );

        if (num_deleted === 0) {
            this.context.exceptions.throw_path_not_found(
                "FileSystemObject",
                "Unable to delete: no folders found.",
                "No files were found which match the pattern expression."
            );
        }
    }

    // Returns true if the specified drive exists; false if it does
    // not.
    driveexists (drivespec) {
        this.ee.emit("FileSystemObject.DriveExists");

        drivespec = drivespec.toLowerCase();

        switch (drivespec) {
        case "c":
        case "c:":
        case "c:\\":
        case "c:/":
            return true;

        default:
            return false;
        }
    }

    // Returns true if a specified file exists; false if it does not.
    fileexists (filepath) {

        if (this.vfs.IsWildcard(filepath) || /[\\/]$/.test(filepath)) {
            return false;
        }

        if (this.vfs.PathIsRelative(filepath)) {
            filepath = win32path.join(this.context.get_env("path"), filepath);
        }

        return this.vfs.FileExists(filepath);
    }

    // Returns true if a specified folder exists; false if it does
    // not.
    folderexists (dirpath) {

        if (this.vfs.IsWildcard(dirpath)) {
            return false;
        }

        if (this.vfs.PathIsRelative(dirpath)) {
            dirpath = win32path.join(this.context.get_env("path"), dirpath);
        }

        return this.vfs.FolderExists(dirpath);
    }

    // Returns a complete and unambiguous path from a provided path
    // specification.
    getabsolutepathname (path) {

        if (this.vfs.PathIsRelative(path)) {
            path = win32path.join(this.context.get_env("path"), path);
        }

        return path;
    }

    // Returns a string containing the base name of the last
    // component, less any file extension, in a path.
    getbasename (path) {

        if (path === ".") return "";
        if (path === "..") return ".";

        let basename = win32path.basename(path);
        basename = basename.replace(/\.[^.]*$/g, "");
        return basename;
    }

    // Returns a Drive object corresponding to the drive in a
    // specified path.
    getdrive (drivespec) {

        if (typeof drivespec !== "string") {
            this.context.exceptions.throw_invalid_fn_arg(
                "FileSystemObject",
                "GetDrive method accepts only string parameters.",
                "Only string parameters should be passed to " +
                    "GetDrive()."
            );
        }

        drivespec = drivespec.toLowerCase();
        return new JS_Drive(this.context, drivespec);
    }

    // Returns a string containing the name of the drive for a
    // specified path.
    getdrivename (path) {

        if (typeof path !== "string") {
            this.context.exceptions.throw_invalid_fn_arg(
                "FileSystemObject",
                "GetDriveName expects a string parameter.",
                "Only strings which resemble a path should be " +
                    "passed to GetDriveName()."
            );
        }

        if (/^[a-z]:/i.test(path)) {
            return path.substr(0, 2);
        }

        return "";
    }

    // Returns a string containing the extension for the last
    // component in a path.  Some examples:
    //
    // C:\Users\foo.txt => txt
    // C:*              => ""
    //
    getextensionname (filepath) {

        if (filepath === undefined || filepath === null) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "FileSystemObject",
                "GetExtensionName requires input parameter.",
                "GetExtensionName requires an input parameter."
            );
        }

        if (Object.keys(filepath).length === 0 && filepath.constructor.name === "Object") {
            return "";
        }

        try {
            filepath = filepath + "";
        }
        catch (_) {
            console.log(_);
            this.context.exceptions.throw_invalid_fn_arg(
                "FileSystemObject",
                "GetExtensionName expects a string parameter.",
                "The string should resemble a path so the ext can " +
                    "be returned."
            );
        }

        const basename = win32path.extname(filepath).replace(".", "");
        return basename;
    }

    // Returns a File object corresponding to the file in a specified
    // path.
    getfile (filepath) {

        const throw_invalid_fn_arg = function () {
            this.context.exceptions.throw_invalid_fn_arg(
                "FileSystemObject",
                "FileSystemObject.GetFile requires param.",
                "A required parameter (filepath) was missing from " +
                    "the call to #GetFile."
            );
        }.bind(this);

        if (filepath === undefined || filepath === null || filepath === "") {
            throw_invalid_fn_arg();
        }

        if (typeof filepath !== "string") {
            try {
                filepath = filepath.toString();
            }
            catch (_) {
                throw_invalid_fn_arg();
            }
        }

        if (this.vfs.IsWildcard(filepath)) {
            this.throw_file_not_found("The given filepath must not contain wildcards.");
        }

        if (this.vfs.PathIsRelative(filepath)) {
            filepath = filepath.replace(/^C:/i, "");
            filepath = win32path.join(this.context.get_env("path"), filepath);
        }

        return new JS_File(this.context, filepath);
    }

    // Returns the last component of specified path that is not part
    // of the drive specification.
    getfilename () {

    }

    // Returns a Folder object corresponding to the folder in a
    // specified path.
    getfolder (path) {

    }

    // Returns a string containing the name of the parent folder of
    // the last component in a specified path.
    getparentfoldername () {

    }

    // Returns the special folder object specified.
    getspecialfolder () {

    }

    // Returns a randomly generated temporary file or folder name that
    // is useful for performing operations that require a temporary
    // file or folder.
    gettempname () {

    }

    // Moves one or more files from one location to another.
    movefile () {

    }

    // Moves one or more folders from one location to another.
    movefolder () {

    }

    // Opens a specified file and returns a TextStream object that can
    // be used to read from, write to, or append to the file.
    opentextfile () {

    }
}


module.exports = function create(context) {
    let fso = new JS_FileSystemObject(context);
    return proxify(context, fso);
};
