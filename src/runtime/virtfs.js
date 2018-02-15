const pathlib    = require("path").win32;
const exceptions = require("../exceptions");
const _          = require("lodash");
const FolderObject = require("../winapi/FolderObject");
const FileObject   = require("../winapi/FileObject");
const AbsFileSystemObject = require("../absFileSystemObject");

class VirtualFileSystem {

    constructor(context) {
	this.context    = context;
	this.context.register("VirtualFileSystem", this, context);
	this.register = context.register;
	this.volume = {};
	this.volume["c:"] = new FolderObject(context, "c:", true);
    }

    VolumeExists (volume_label) {
	return this.volume.hasOwnProperty(volume_label.toLowerCase());
    }

    GetVolume (volume_label) {
	return this.volume[volume_label.toLowerCase()];
    }

    GetFile (path) {

	var self = this;
	
	let parsed_path = AbsFileSystemObject.Parse(path);

	if (!this.VolumeExists(parsed_path.volume)) {
	    return false;
	}

	var cwd = this.GetVolume(parsed_path.volume),
	    found_file = false;

	var result = parsed_path.orig_path_parts_mv.every((path_part, i, all_path_parts) => {

	    // Is this the last element?
	    if (i === (parsed_path.orig_path_parts_mv.length - 1)) {
		let find_result = cwd.Files.find((x) => x.Name === path_part);

		if (!find_result) return false;
		found_file = find_result;
	    }

	    // This isn't (yet) the last element, so let's see if
	    // `path_part' exists as a subfolder at this level...
	    var found = cwd.SubFolders.find((x) => x.Name === path_part);
	    if (!found) return false;

	    cwd = found;
	    return true;
	});

	return found_file;
    }
    
    
    AddFolder (path) {

	var self = this;

	let parsed_path = AbsFileSystemObject.Parse(path);

	if (!this.VolumeExists(parsed_path.volume)) {
	    console.log(`!-- UNKNOWN VOLUME "${parsed_path.volume}" --!`);
	    return false;
	}

	var cwd  = this.GetVolume(parsed_path.volume),
	    path = parsed_path.volume;

	parsed_path.orig_path_parts_mv.some((path_part) => {

	    path = `${path}\\${path_part}`;
	    
	    let fo = new FolderObject(self, path);
	    cwd = cwd.AddSubFolder(fo);
	    return false;
	});

	return cwd;
    }

    AddFile (path, contents) {

	let parsed_path = AbsFileSystemObject.Parse(path),
	    file_path   = parsed_path.orig_path_parts_mv.slice(0, -1);

	contents = contents || "";

	var cwd;

	if (file_path.length === 0) {
	    // This is located in the root-volume
	    cwd = this.GetVolume(parsed_path.volume);
	}
	else {
	    file_path = `${parsed_path.volume}\\${file_path.join("\\")}`;
	    cwd       = this.AddFolder(file_path);
	}

	let fo = new FileObject(this, path, { contents: contents });
	return cwd.AddFile(fo);
    }

    CopyFileToFolder (src_file_path, dest_file_path, overwrite) {

	let src_file_name = pathlib.basename(src_file_path);

	dest_file_path += `\\${src_file_name}`;

	// First, make sure the source file actually exists...
	let src_file = this.GetFile(src_file_path);

	if (!src_file) {
	    console.log(`Cannot copy ${src_file_path}`,
			`to ${dest_file_path} - file not found.`);
	    return false;
	}

	let result = this.AddFile(dest_file_path, src_file.contents);
	return result;
    }
}

module.exports = VirtualFileSystem;
