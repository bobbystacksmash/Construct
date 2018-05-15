const events     = require("./events"),
      pathlib    = require("path").win32,
      util       = require("util");

class AbsFileSystemObject {

    constructor(context, path, type, args) {
	this.ctx = context;

	let parsed_path   = pathlib.parse(path),
	    volume_letter = parsed_path.root.replace(/\\/g, "");

	args = args || {};

	this.Attributes       = null; // Int
	this.DateCreated      = null; // date
	this.DateLastAccessed = null; // date
	this.DateLastModified = null; // date
	this.Drive            = volume_letter;
	this.Name             = parsed_path.base;
	this.ParentFolder     = null; // FolderObject
	this.Path             = path.toLowerCase();
	this.ShortName        = null; // String
	this.ShortPath        = null; // String
	this.Size             = null; // Int
	this.Type             = type; // File or File Folder
	this.__contents       = args.contents || "";
    }

    /*
     * ThrowIfInvalidPath
     * ==================
     *
     * Performs path validation.  If the `path' is valid,
     * `ValidatePath' returns `null'.  However, if the path is
     * invalid, it raises an exception.
     *
     */
    static ThrowIfInvalidPath (path, options) {

        options = options || { file: false };

        // RESERVED CHARACTER USAGE IN FILENAMES
        //
        //  https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx
        //
        // Microsoft list the following characters as being illegal in
        // NFTS paths:
        //
        //   < (less than)
        //   > (greater than)
        //   : (colon)
        //   " (double quote)
        //   / (forward slash)
        //   \ (backslash)
        //   | (vertical bar or pipe)
        //   ? (question mark)
        //   * (asterisk)
        //
        //
        // The following code is adopted from:
        //
        //   - https://github.com/jonschlinkert/is-invalid-path/blob/master/index.js
        //
        // Unable to use this library as it adds a senseless condition
        // to check if the OS is Windows.
        //
        //
        // Remove the volume lable from the beginning of the path,
        // such as: `C:\'
        //
        let path_root = pathlib.parse(pathlib.normalize(path)).root;
        if (path_root) {
            path = path.slice(path_root.length);
        }

        if (options.file) {
            if (/[<>:"/\\|?*]/.test(path)) {
                throw new Error("Filename contains invalid characters.");
            }
        }
        else if (/[<>:"|?*]/.test(path)) {
            throw new Error("Path contains invalid characters.");
        }
    }


    static Parse (path) {

	// Replace all forward slashes with back slashes...
	path = path.replace(/\//, "\\").toLowerCase();
	path = path.replace(/\\\\/, "");

	let ends_with_path_sep = /\/$/.test(path);

        try {
	    var parsed_path   = pathlib.parse(path),
	        path_parts    = parsed_path.dir.split(/\\/),
	        volume_letter = parsed_path.root.replace(/\\/g, "").toLowerCase();
        }
        catch (e) {

        }

	parsed_path.volume             = volume_letter;
	parsed_path.assumed_folder     = ends_with_path_sep;
	parsed_path.orig_path          = path;
	parsed_path.orig_path_parts    = path.split("\\");
	parsed_path.orig_path_parts_mv = parsed_path.orig_path_parts.slice(1);

	return parsed_path;
    };
}

module.exports = AbsFileSystemObject;
