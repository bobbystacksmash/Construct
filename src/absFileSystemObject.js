const events     = require("./events"),
      exceptions = require("./exceptions"),
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

    static Parse(path) {

	// Replace all forward slashes with back slashes...
	path = path.replace(/\//, "\\").toLowerCase();
	path = path.replace(/\\\\/, "");

	let ends_with_path_sep = /\/$/.test(path);
	
	let parsed_path   = pathlib.parse(path),
	    path_parts    = parsed_path.dir.split(/\\/),
	    volume_letter = parsed_path.root.replace(/\\/g, "").toLowerCase();

	parsed_path.volume             = volume_letter;
	parsed_path.assumed_folder     = ends_with_path_sep;
	parsed_path.orig_path          = path;
	parsed_path.orig_path_parts    = path.split("\\");
	parsed_path.orig_path_parts_mv = parsed_path.orig_path_parts.slice(1);

	return parsed_path;
    };
}

module.exports = AbsFileSystemObject;
