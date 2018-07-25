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

        this.__name__ = "FileSystemObject";

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

        if (typeof dirpath !== "string") {
            try {
                dirpath = dirpath.toString();
            }
            catch (e) {
                throw e;
            }
        }

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

    // GetFileName
    // ===========
    //
    // Returns the last component of specified path that is not part
    // of the drive specification.
    getfilename (filename) {

        if (Array.prototype.slice.call(arguments).length === 0) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "FileSystemObject",
                "No arguments passed to GetFileName",
                "No arguments passed to GetFileName"
            );
        }

        if (filename === null) {
            this.context.exceptions.throw_type_mismatch(
                "FileObject",
                "Unsupported parameter type: null",
                "Null is not a valid function parameter."
            );
        }

        if (filename === " ") return "";
        if (filename === undefined) return "";

        const basename = win32path.basename(filename);
        return basename;
    }

    // GetFileVersion
    // ==============
    //
    // Retrieves version information about the file.
    //
    // PLUGIN
    // ------
    //
    // TODO: write plugin code.
    //
    getfileversion (filepath) {

        // TODO: Add plugin code here.

        if (this.vfs.IsWildcard(filepath)) {
            this.context.exceptions.throw_error(
                "FileSystemObject",
                "Wildcard characters not allowed in GetFileVersion.",
                "Wildcard characters not allowed in GetFileVersion."
            );
        }

        if (this.vfs.PathIsRelative(filepath)) {
            filepath = filepath.replace(/^C:/i, "");
            filepath = win32path.join(this.context.get_env("path"), filepath);
        }

        if (this.vfs.FileExists(filepath) === false) {
            this.context.exceptions.throw_error(
                "FileSystemObject",
                "Cannot find file.",
                "Unable to obtain version number -- file does not exist."
            );
        }

        return "";
    }

    // Returns a Folder object corresponding to the folder in a
    // specified path.
    getfolder (path) {

        const throw_invalid_fn_arg = function () {
            this.context.exceptions.throw_invalid_fn_arg(
                "FileSystemObject",
                "FileSystemObject.GetFolder requires param.",
                "A required parameter (path) was missing from " +
                    "the call to #GetFolder."
            );
        }.bind(this);

        if (path === undefined || path === null) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "FileSystemObject",
                "FileSystemObject.GetFolder - no input.",
                "Method requires a string representing a valid path " +
                    "to a file."
            );
        }

        if (typeof path !== "string") {
            try {
                path = path.toString();
            }
            catch (_) {
                throw_invalid_fn_arg();
            }
        }

        if (path === "") {
            throw_invalid_fn_arg();
        }

        if (this.vfs.IsWildcard(path)) {
            this.throw_file_not_found("The given path must not contain wildcards.");
        }

        if (this.vfs.PathIsRelative(path)) {
            path = path.replace(/^C:/i, "");
            path = win32path.join(this.context.get_env("path"), path);
        }

        return new JS_Folder(this.context, path);
    }

    // GetParentFolderName
    // ===================
    //
    // Returns a string containing the name of the parent folder of
    // the last component in a specified path.
    //
    // This is a string manipulation function and does not perform any
    // on-disk checks against the names given to it.
    //
    getparentfoldername (path) {

        if (/^[A-Z]:(?:[\\/]*)$/i.test(path)) return "";

        const dirname = win32path.dirname(path);
        if (dirname.toLowerCase() === "c:\\") return dirname;

        if (dirname === ".") {
            return "";
        }
        else {
            return dirname;
        }
    }

    // GetSpecialFolder
    // ================
    //
    // Returns a Folder object which represents one of three "special"
    // folder locations:
    //
    // | Const | Path                                  |
    // |-------|---------------------------------------|
    // |   0   | C:\Windows                            |
    // |   1   | C:\Windows\System32                   |
    // |   2   | C:\Users\Construct\AppData\Local\Temp |
    //
    // Any other values will cause GetSpecialFolder() to throw.
    //
    getspecialfolder (special_folder) {

        if (arguments.length === 0) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "FileSystemObject",
                "No arguments supplied to GetSpecialFolder.",
                "Ensure that an argument is passed to GetSpecialFolder()."
            );
        }

        if (special_folder === null || (Array.isArray(special_folder))) {
            this.context.exceptions.throw_type_mismatch(
                "FileSystemObject",
                "The value 'null' is not a valid input for GetSpecilFolder().",
                "The value 'null' is not a valid input for GetSpecilFolder()."
            );
        }

        // Notice double-equal below.
        if (special_folder === undefined || special_folder == false) {
            special_folder = 0;
        }

        const SPECDIR = {
            0: "C:\\Windows",
            1: "C:\\Windows\\System32",
            2: "C:\\Users\\Construct\\AppData\\Local\\Temp"
        };

        if (SPECDIR.hasOwnProperty(special_folder)) {
            return new JS_Folder(this.context, SPECDIR[special_folder]);
        }

        this.context.exceptions.throw_invalid_fn_arg(
            "FileSystemObject",
            "Invalid function argument passed to GetSpecialFolder().",
            "Invalid function argument passed to GetSpecialFolder()."
        );
    }

    // GetStandardStream
    // =================
    //
    // Fetches one of the Std{In,Out,Err} TextStream instances.  The
    // streams and their corresponding constants are:
    //
    // | Const | Stream           |
    // |-------|------------------|
    // |   0   | Standard Input.  |
    // |   1   | Standard Output. |
    // |   2   | Standard Error.  |
    //
    getstandardstream (stream, unicode) {

        if (stream === false || stream === undefined) {
            this.context.exceptions.throw_bad_file_mode(
                "FileSystemObject",
                "Stream option 'false' is not valid.",
                "Stream option 'false' is not valid."
            );
        }
        else if (stream === null || Array.isArray(stream) || typeof stream === "object") {
            this.context.exceptions.throw_type_mismatch(
                "FileSystemObject",
                "Null is not a valid stream type.",
                "Please select a different stream type [0, 1, 2]."
            );
        }

        const STDIN  = 0,
              STDOUT = 1,
              STDERR = 2;

        const STD_STREAMS = {
            0: "STDIN",
            1: "STDOUT",
            2: "STDERR"
        };

        switch (STD_STREAMS[stream]) {
        case "STDIN":
            return this.context.streams.stdin;

        case "STDERR":
            return this.context.streams.stderr;

        case  "STDOUT":
            return this.context.streams.stdout;

        default:
            this.context.exceptions.throw_range_error(
                "FileSystemObject",
                "Cannot get standard stream - ID out of range.",
                "Accepted ranges for standard streams is 0-2 inclusive."
            );
        }
    }

    // GetTempName
    // ===========
    //
    // Returns a randomly generated temporary file or folder name that
    // is useful for performing operations that require a temporary
    // file or folder.
    gettempname () {

        if (arguments.length > 0) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "FileSystemObject",
                "GetTempName() does not accept any parameters.",
                "GetTempName() does not accept any parameters."
            );
        }

        let mktmp = () => {
            let ht = (this.context.epoch * 100000).toString(16).substr(0, 5).toUpperCase();
            return `ado${ht}.tmp`;
        };
        this.context.skew_time_ahead_by(1);
        return mktmp();
    }

    // MoveFile
    // ========
    //
    // Moves one or more files from one location to another.
    movefile (source, destination) {

        let srcpath                  = this.vfs.Resolve(source, { sfn_to_lfn: true }),
            srcpath_parent_dir       = win32path.dirname(srcpath),
            dstpath                  = this.vfs.Resolve(destination, { sfn_to_lfn: true }),
            dstpath_trailing_pathsep = /[\\/]$/.test(destination),
            dstpath_exists           = (this.vfs.FileExists(dstpath) || this.vfs.FolderExists(dstpath));

        if (this.vfs.IsWildcard(destination)) {
            this.context.exceptions.throw_invalid_fn_arg(
                "FileSystemObject",
                "Destination path must not contain wildcard chars.",
                "The destination path contains wildcard character(s) " +
                    "which are not permitted."
            );
        }
        else if (this.vfs.IsWildcard(srcpath_parent_dir)) {
            this.context.exceptions.throw_invalid_fn_arg(
                "FileSystemObject",
                "Source path may only contain wildcards as the last part.",
                "Only the last part of the source path may contain wildcard " +
                    "characters."
            );
        }

        if (this.vfs.IsFolder(srcpath)) {
            this.context.exceptions.throw_file_not_found(
                "FileSystemObject",
                "Cannot apply MoveFile to a folder.",
                "Failed because a move was attempted on a source which was a " +
                    "folder when a file was expected."
            );
        }

        if (this.vfs.IsWildcard(srcpath)) {

            const pattern     = win32path.basename(srcpath),
                  match_files = this.vfs.FindFiles(srcpath_parent_dir, pattern);

            match_files.forEach(filename => {
                let fullpath_src = win32path.join(srcpath_parent_dir, filename),
                    fullpath_dst = win32path.join(dstpath,    filename);

                if (this.vfs.Exists(fullpath_dst)) {
                    this.context.exceptions.throw_file_exists(
                        "FileSystemObject",
                        "Cannot move because destination exists.",
                        "Cannot move because destination exists."
                    );
                }

                this.vfs.MoveFile(fullpath_src, fullpath_dst);
            });
            return;
        }

        if (dstpath_trailing_pathsep === false && dstpath_exists) {
            this.context.exceptions.throw_file_already_exists(
                "FileSystemObject",
                "File move destination name already exists.",
                "The requested destination already exists and " +
                    "is a folder."
            );
        }

        if (this.vfs.FolderExists(dstpath)) {
            dstpath = win32path.join(dstpath, win32path.basename(srcpath));
        }

        if (this.vfs.FileExists(dstpath)) {
            this.context.exceptions.throw_file_already_exists(
                "FileSystemObject",
                "Destination already exists.",
                "The destination file already exists -- cannot move."
            );
        }

        this.vfs.MoveFile(srcpath, dstpath);
    }

    // MoveFolder
    // ==========
    //
    // Moves one or more folders from one location to another.
    // Wildcards are not supported directly by the VFS, so wildcards
    // are expanded here before moving.
    //
    movefolder (source, destination) {

        const srcpath = this.vfs.Resolve(source),
              dstpath = this.vfs.Resolve(destination);

        if (this.vfs.IsWildcard(dstpath)) {
            this.context.exceptions.throw_invalid_fn_arg(
                "FileSystemObject",
                "Destination path must not contain wildcard chars.",
                "The destination path contains wildcard character(s) " +
                    "which are not permitted."
            );
        }
        else if (this.vfs.IsWildcard(win32path.dirname(srcpath))) {
            this.context.exceptions.throw_invalid_fn_arg(
                "FileSystemObject",
                "Source path may only contain wildcards as the last part.",
                "Only the last part of the source path may contain wildcard " +
                    "characters."
            );
        }

        if (this.vfs.IsWildcard(srcpath)) {

            const pattern       = win32path.basename(srcpath),
                  src_dirname   = win32path.dirname(srcpath),
                  match_folders = this.vfs.FindFolders(src_dirname, pattern);

            if (match_folders.length === 0) {
                this.context.exceptions.throw_path_not_found(
                    "FileSystemObject",
                    "No folders could be found for copying in srcdir.",
                    "The wildcard expression didn't match any folders in srcdir, " +
                        "either because the dir contains zero folders, or no folders " +
                        "match the wildcard expression."
                );
            }

            match_folders.forEach(foldername => {
                let fullpath_src = win32path.join(src_dirname, foldername),
                    fullpath_dst = win32path.join(dstpath,     foldername);

                if (!this.vfs.Exists(fullpath_dst)) {
                    this.vfs.AddFolder(fullpath_dst);
                }
                else {
                    this.context.exceptions.throw_file_exists(
                        "FileSystemObject",
                        "The MoveFolder method throws when moving the same name from src->dst.",
                        "When moving a folder, if that folder exists in the destination, rather " +
                            "than merging the two folders, FSO.MoveFolder throws instead."
                    );
                }

                this.vfs.MoveFolder(fullpath_src, `${fullpath_dst}\\`, false);
            });
            return;
        }

        if (this.vfs.Exists(srcpath) === false) {
            this.context.exceptions.throw_path_not_found(
                "FileSystemObject",
                "Cannot find source path to move.",
                "The source file location cannot be found so cannot be moved."
            );
        }
        else if (this.vfs.IsFile(srcpath)) {
            this.context.exceptions.throw_path_not_found(
                "FileSystemObject",
                "Cannot apply MoveFolder to a source file.",
                "The source argument to MoveFolder must be a folder, not " +
                    "a file."
            );
        }

        if (this.vfs.Exists(win32path.dirname(dstpath)) === false) {
            this.context.exceptions.throw_path_not_found(
                "FileSystemObject",
                "Cannot find the destination path.",
                "Cannot move files to a destination path that does not exist."
            );
        }
        else if (this.vfs.IsFile(dstpath)) {
            this.context.exceptions.throw_file_already_exists(
                "FileSystemObject",
                "Cannot move folder in to an existing file.",
                "The destination is a file.  Destination should either not exist " +
                    "or be a folder."
            );
        }

        this.vfs.MoveFolder(srcpath, dstpath, false);
    }

    // OpenTextFile
    // ============
    //
    // Opens a specified file and returns a TextStream object that can
    // be used to read from, write to, or append to the file.
    //
    // This is exactly the same method as used by the
    // File->OpenAsTextStream, with some minor scaffolding changes
    // applied.
    //
    opentextfile (filepath, iomode, create, format) {

        if (this.vfs.IsWildcard(filepath)) {
            this.context.exceptions.throw_bad_filename_or_number(
                "FileSystemObject",
                "OpenTextFile will not accept a filepath which contains wildcards.",
                "OpenTextFile will not accept a filepath which contains wildcards."
            );
        }

        if (create === undefined || create === null) {
            create = true;
        }

        let throw_type_mismatch = () => {
            this.context.exceptions.throw_type_mismatch(
                "FileSystemObject",
                "Invalid 'create' type given.",
                "Invalid 'create' type given."
            );
        };

        // TODO This is very messy.  We need a new handling lib for
        // all classes.
        if (typeof create === "string") {
            let tmpcreate = parseInt(create, 10);
            if (isNaN(tmpcreate)) {

                if (/^true|false$/.test(create)) {
                    create = (create.toLowerCase() === "true");
                }
                else {
                    throw_type_mismatch();
                }
            }

            create = (tmpcreate == true);
        }
        else if (Array.isArray(create)) {
            throw_type_mismatch();
        }
        else {
            create = !!create;
        }

        filepath = this.vfs.Resolve(filepath);

        if (create && this.vfs.Exists(filepath) === false) {
            this.vfs.AddFile(filepath);
        }
        // filepath: relative or absolute
        // iomode setting is 'ForReading(1)' default
        // Format setting is 'ASCII' default
        //
        return new JS_File(this.context, filepath).OpenAsTextStream(iomode, format);
    }
}


module.exports = function create(context) {
    let fso = new JS_FileSystemObject(context);
    return proxify(context, fso);
};
