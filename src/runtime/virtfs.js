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

    GetFolder (path) {

	let parsed_path = AbsFileSystemObject.Parse(path);

	if (!this.VolumeExists(parsed_path.volume)) {
	    return false;
	}

	var cwd = this.GetVolume(parsed_path.volume),
	    found_folder = false;

	var result = parsed_path.orig_path_parts_mv.every((path_part, i, all_path_parts) => {
	    // Is this the last element?
	    if (i === (parsed_path.orig_path_parts_mv.length - 1)) {
		// Does the cwd contain a subfolder that matches
		// this element...
		let existing_folder = cwd.SubFolders.find((x) => x.Name === path_part);

		if (existing_folder) {
		    cwd = existing_folder;
		    return true;
		}

		return false;
	    }

	    // This isn't (yet) the last element, so let's see if
	    // `path_part' exists as a subfolder at this level...
	    var found = cwd.SubFolders.find((x) => x.Name === path_part);

	    if (!found) return false;

	    cwd = found;
	    return true;
	});

	if (!result) return false;
	return cwd;
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

    AddFile (path, contents, opts) {

	opts = opts || {};
	if (!opts.hasOwnProperty("overwrite")) opts.overwrite = false;
	const overwrite = opts.overwrite;

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
	return cwd.AddFile(fo, opts);
    }

    // Copies the folder in `src_folder_path' in to
    // `dest_folder_path'.  If you need to copy folder *contents*, use
    // `CopyFolderContentsToFolder' instead.
    CopyFolderToFolder (src_folder_path, dest_folder_path, opts) {

	opts = opts || { merge: true };

	var result = { success: false, reason: "Unknown" };

	let src_folder = this.GetFolder(src_folder_path),
	    dest_folder = this.GetFolder(dest_folder_path);

	if (!src_folder) {
	    result.reason = `The source path (${src_folder_path}) does not exist.`;
	    return result;
	}

	if (!this.GetFolder(dest_folder_path)) {
	    result.reson = `The dest path (${dest_folder_path}) does not exist.`;
	    return result;
	}

	// First, let's see if the destination already contains a folder
	// with the same name as `src'.
	if (dest_folder.HasSubFolder(src_folder.Name)) {
	    // This becomes a merge operation...
	}
	else {
	    // This is a basic copy.
	    let new_folder_obj = {};
	    Object.assign(new_folder_obj, src_folder);
	    return dest_folder.AddSubFolder(new_folder_obj);
	}
    }

    CopyFileToFolder (src_file_path, dest_file_path, opts) {

	opts = opts || { overwrite: false };
	const overwrite = opts.overwrite;

	let src_file_name = pathlib.basename(src_file_path);

	dest_file_path += `\\${src_file_name}`;

	// First, make sure the source file actually exists...
	let src_file = this.GetFile(src_file_path);

	if (!src_file) {
	    console.log(`Cannot copy ${src_file_path}`,
			`to ${dest_file_path} - file not found.`);
	    return false;
	}

	// Second, we shouldn't overwrite the file if it already exists..
	if (this.GetFile(dest_file_path) && overwrite === false) {
	    /*console.log(`Cannot copy ${src_file_path}`,
			`to ${dest_file_path} - dst file exists and `,
			`overwrite is ${overwrite}.`);*/
	    return false;
	}

	let result = this.AddFile(dest_file_path, src_file.contents, opts);
	return result;
    }

    DeleteFile (path) {

	let parsed_path = AbsFileSystemObject.Parse(path),
	    file        = this.GetFile(path);

	if (!file) return false; // nothing to delete.

	return file.ParentFolder.DeleteFile(file.Name);
    }

    DeleteFolder (path) {

	let parsed_path = AbsFileSystemObject.Parse(path),
	    folder      = this.GetFolder(path);

	if (!folder || !folder.ParentFolder) return false;

	// Jump up to the parent folder, then we'll get the index
	// of the folder-to-be-deleted's name, and remove it from
	// the Subfolders array.
	return folder.ParentFolder.DeleteSubFolder(folder.Name);
    }
}

module.exports = VirtualFileSystem;
