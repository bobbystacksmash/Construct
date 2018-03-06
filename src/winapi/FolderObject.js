/* 
 * "Provides access to all the properties of a folder."
 *  - https://msdn.microsoft.com/en-us/library/1c87day3(v=vs.84).aspx
 *
 * METHODS
 * ~~~~~~~
 * Copy https://msdn.microsoft.com/en-us/library/6973t06a(v=vs.84).aspx
 * Delete https://msdn.microsoft.com/en-us/library/0k4wket3(v=vs.84).aspx
 * Move https://msdn.microsoft.com/en-us/library/kxtftw67(v=vs.84).aspx
 * CreateTextFile https://msdn.microsoft.com/en-us/library/5t9b5c0c(v=vs.84).aspx
 *
 *
 * PROPERTIES
 * ~~~~~~~~~~
 *  - Attributes https://msdn.microsoft.com/en-us/library/5tx15443(v=vs.84).aspx
 *  - DateCreated https://msdn.microsoft.com/en-us/library/ke6a7czx(v=vs.84).aspx
 *  - DateLastAccessed https://msdn.microsoft.com/en-us/library/6zc3f20t(v=vs.84).aspx
 *  - DateLastModified https://msdn.microsoft.com/en-us/library/c8xh895w(v=vs.84).aspx
 *  - Drive https://msdn.microsoft.com/en-us/library/2hawed3c(v=vs.84).aspx
 *  - Files https://msdn.microsoft.com/en-us/library/18b41306(v=vs.84).aspx
 *  - IsRootFolder https://msdn.microsoft.com/en-us/library/w5kzk8s5(v=vs.84).aspx
 *  - Name https://msdn.microsoft.com/en-us/library/zawxett8(v=vs.84).aspx
 *  - ParentFolder https://msdn.microsoft.com/en-us/library/dt64ftxb(v=vs.84).aspx
 *  - Path https://msdn.microsoft.com/en-us/library/x9kfyt6a(v=vs.84).aspx
 *  - ShortName https://msdn.microsoft.com/en-us/library/htyh9b2z(v=vs.84).aspx
 *  - ShortPath https://msdn.microsoft.com/en-us/library/tes8ehwe(v=vs.84).aspx
 *  - Size https://msdn.microsoft.com/en-us/library/2d66skaf(v=vs.84).aspx
 *  - SubFolders https://msdn.microsoft.com/en-us/library/e1dthkks(v=vs.84).aspx
 *  - Type https://msdn.microsoft.com/en-us/library/y7k0wsxy(v=vs.84).aspx
 *
 */
const AbsFileSystemObject = require("../absFileSystemObject");


class FolderObject extends AbsFileSystemObject {

    constructor(context, path, isRoot) {

	super(context, path, "File Folder");
	this.context = context;
	context.register("FolderObject", this, context);

	this.Files        = [];
	this.IsRootFolder = isRoot;
	this.SubFolders   = [];
    }

    AddFile (file, opts) {

	opts = opts || { overwrite: false };
	const overwrite = opts.overwrite;

	let existing_file_idx = this.Files.findIndex((existing_file) => {
	    return existing_file.Name.toLowerCase() === file.Name.toLowerCase();
	});

	let existing_file =
	    (existing_file_idx > -1)
	    ? this.Files[existing_file_idx]
	    : false;

	if (existing_file) {

	    if (overwrite === true) {
		file.ParentFolder = this;
		this.Files[existing_file_idx] = file;
		return this.Files[existing_file_idx];
	    }
	    else {
		return existing_file;
	    }
	}
	else if (!existing_file) {
	    // File does not exist!
	    file.ParentFolder = this;
	    this.Files.push(file);
	    return file;
	}
    }

    DeleteFile (filename) {

	const filename_idx = this.Files.findIndex((f) => f.Name === filename);
	
	if (filename_idx > -1) {
	    this.Files.splice(filename_idx, 1);
	    return true;
	}

	return false;
    }

    DeleteSubFolder (foldername) {

	const foldername_idx = this.SubFolders.findIndex((f) => f.Name === foldername);

	if (foldername_idx > -1) {
	    this.SubFolders.splice(foldername_idx, 1);
	    return true;
	}

	return false;
    }

    HasSubFolder (folder) {
	let result = this.SubFolders.find((x) => x.Name === folder);
	return (result) ? true : false;
    }

    AddSubFolder (folder) {

	let existing_subfolder = this.SubFolders.find((sub_folder) => {
	    return sub_folder.Name.toLowerCase() === folder.Name.toLowerCase();
	});

	if (!existing_subfolder) {
	    folder.ParentFolder = this;
	    this.SubFolders.push(folder);
	    return this.SubFolders[this.SubFolders.length - 1];
	}
	else {
	    return existing_subfolder;
	}
    }

    Add (folder) {
	return this.AddSubFolder(folder);
    }
}

module.exports = FolderObject;