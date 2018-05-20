const pathlib    = require("path").win32;
const _          = require("lodash");
const FolderObject = require("../winapi/FolderObject");
const FileObject   = require("../winapi/FileObject");
const AbsFileSystemObject = require("../absFileSystemObject");
const is_relative  = require("is-relative");

class VirtualFileSystem {

    constructor(context) {
	this.context = context;
	this.volume = {};
        this.volume["c:"] = new FolderObject(context, "c:", true);
    }

    //
    // Based on the information extracted from this article:
    //
    //   - https://blogs.msdn.microsoft.com/jeremykuhne/2017/06/04/wildcards-in-windows/
    //
    // this method will attempt to perform replacements of wildcard
    // characters in the following order:
    //
    //   1.  All '.' followed by either '?' or '*' are changed to '"'.
    //   2.  All '?' are changed to '>'.
    //   3.  A path ending in '*' that has a period

    _NormaliseFilename (filename) {

        // As documented below, as part of normalisation, Windows
        // removes paths which *end* in a period.  In order for our
        // wildcard normaliser to copy this behaviour, we need to
        // track whether or not our path ended with a period, and
        // remove it if it does.
        //
        //  - https://blogs.msdn.microsoft.com/jeremykuhne/2016/04/21/path-normalization/
        //    (See section "Trimming Characters")
        //
        let filename_ends_with_period = /\.$/.test(filename);

        let normalised_filename = filename
                .replace(/\.$/,      '')
                .replace(/\.[?*]/g, '"')
                .replace(/\?/g,     ">");

        if (filename_ends_with_period && /\*$/.test(normalised_filename)) {
            normalised_filename = normalised_filename.replace(/\*$/, "<");
        }

        return normalised_filename;
    }


    // References:
    //
    //  - https://www.dostips.com/forum/viewtopic.php?f=3&t=6207
    //  - https://blogs.msdn.microsoft.com/jeremykuhne/2017/06/04/wildcards-in-windows/
    //  - https://msdn.microsoft.com/en-us/library/windows/desktop/aa364419(v=vs.85).aspx
    //  - https://ss64.com/nt/syntax-wildcards.html
    //  - https://superuser.com/questions/475874/how-does-the-windows-rename-command-interpret-wildcards/475875#475875
    //  - https://blogs.msdn.microsoft.com/oldnewthing/20071217-00/?p=24143/
    //
    // Supports the fetching of files which match the given
    // `filepath'.  Supports Windows wildcards for filenames only.
    //
    _FilenameMatches () {

    }

    GetFileList (filepath) {

        this.NormaliseFilename(filepath);


        let normpath = pathlib.normalize(filepath);

        // First, we can just wing it and see if the file exists...
        if (this.GetFile(normpath)) {
            return [normpath];
        }

        // No dice - maybe the path is invalid?
        // If this throws, we won't handle it - the caller can.
        AbsFileSystemObject.ThrowIfInvalidPath(normpath);

        // Still here? We need to do some work...
        let parsed_path = AbsFileSystemObject.Parse(normpath);

        if (this.GetFolder(parsed_path.dir) === false) {
            // The folder doesn't exist, so we can't match any files.
            return [];
        }

        // If we reach here, then we know that:
        //
        //  - the path is a valid path
        //  - the path exists
        //  - the path could be a wildcard path
        //
        // Let's convert Windows wildcards in to a regexp and build a
        // filelist using that.
        //
        console.log(parsed_path);


        // We throw [this] if the path contains a wildcard:
        //   name TypeError
        //   message Invalid procedure call or argument
        //   number -2146828283
        //   description Invalid procedure call or argument
        //

        return [];
    }

    BuildPath (some_path, new_path_part) {
        // I *really* wanted to just use path.win32.join(...) here,
        //but it seems that Windows doesn't do any validation of the
        //paths it creates, while the Node Pathlib does.
        return [some_path, new_path_part].join("\\");
    }

    VolumeExists (volume_label) {
	return this.volume.hasOwnProperty(volume_label.toLowerCase());
    }

    GetVolume (volume_label) {
	return this.volume[volume_label.toLowerCase()];
    }

    FolderExists (path) {
        return this.GetFolder(path) !== false;
    }

    FileExists (path) {
        return this.GetFile(path) !== false;
    }

    GetFolder (path) {

	let parsed_path = AbsFileSystemObject.Parse(path);

        AbsFileSystemObject.ThrowIfInvalidPath(parsed_path.base);

	if (!this.VolumeExists(parsed_path.volume)) {
            throw new Error("Unknown volume");
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
            throw new Error("Unknown volume");
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

        // Perform path and file checks...
        AbsFileSystemObject.ThrowIfInvalidPath(parsed_path.base, { file: true });
        AbsFileSystemObject.ThrowIfInvalidPath(parsed_path.dir);

        if (this.FileExists(path) === false && this.context.get_cfg("autovivify") === false) {
            throw new Error("Cannot create file -- path does not exist and autovivify disabled.");
        }

        if (typeof contents === "String" || contents instanceof String) {
            contents = Buffer.from(contents, "utf16le");
        }
        else if (!contents instanceof Buffer) {
            throw new Error("Cannot add file contents which are neither " +
                            "a string or a Buffer instance.");
        }
        else if (contents === null || contents === undefined) {
            contents = Buffer.alloc(0);
        }

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

    /*
     * Given a source folder path and a folder destination, this method
     * copies the contents of src in to the destination.  For example, consider
     * the src dir to be called `foo', and it contains one file `bar.txt', and
     * our destination -- `baz.txt'.  Calling CopyFolderContentsToFolder(src, dst)
     * will copy `bar.txt' in to `baz'.
     */
    CopyFolderContentsToFolder (src_folder_path, dest_folder_path, opts) {

	opts = opts || { merge: true };

	let src_folder = this.GetFolder(src_folder_path),
	    dst_folder = this.GetFolder(dest_folder_path);

	var result     = { success: false, reason: "Unknown" };

	// TODO: Need to handle the case where src_folder is the root volume.
	if (!src_folder) {
	    result.reason = `Folder ${src_folder_path} does not exist.`;
	    return result;
	}

	if (!dst_folder) {
	    result.reason = `Folder ${dest_folder_path} does not exist.`;
	    return result;
	}

	if (src_folder.IsRootFolder) {
	    return false;
	}

	// Here?  Great!  This means we have a src and dst folders.
	// Let's begin trying to copy between 'em.
	/*var src_cwd = src_folder,
	  dst_cwd = dst_folder;*/

	var self = this;

	let res = (function walk(src_cwd, dst_cwd) {

	    // Copy files first...
	    var file_copy_result = src_cwd.Files.every((f) => {

		// Does this file exist in dst?
		let dst_existing_file = dst_cwd.Files.findIndex((x) => x.Name === f.Name);

		if (dst_existing_file > -1 && opts.overwrite === false) {
		    // Cannot continue - we have a name collision but are told not
		    // to overwrite.
		    result.reason = `Destination dir (${dst_cwd.Path}) contains ` +
			`source file name already: ${f.Name}`;
		    console.log(`!! -- ${result.reason}`);
		    return false;
		}

		// No file found in dst? Let's create a new slot in
		// dst and move src in to it.
		let src_file_copy = {};
		Object.assign(src_file_copy, f);
		src_file_copy.ParentFolder = dst_cwd;
		src_file_copy.Path = `${dst_cwd.Path}\\${src_file_copy.Name}`;

		if (dst_existing_file > -1) {
		    dst_cwd.Files[dst_existing_file] = src_file_copy;
		}
		else {
		    dst_cwd.Files.push(src_file_copy);
		}

		return true;
	    });

	    if (!file_copy_result) {
		console.log("Filename collision while overwrite is false. Aborting copy.");
		return false;
	    }

	    // Let's now loop through all sub folders, applying copies to them...
	    let sf_copy_result = src_cwd.SubFolders.every((f) => {

		// Does this subfolder exist in dst?
		let dst_existing_subfolder =
		    dst_cwd.SubFolders.find((x) => x.Name === f.Name);

		if (dst_existing_subfolder && opts.overwrite === false) {
		    result.reason = `Destination (${dst_cwd.Path}) contains ` +
			`subfolder already: ${x.Name}.`;
		    return false;
		}

		if (!dst_existing_subfolder) {
		    dst_existing_subfolder = self.AddFolder(`${dst_cwd.Path}\\${f.Name}`);
		}

		return walk(f, dst_existing_subfolder);
	    });

	    return sf_copy_result;

	}(src_folder, dst_folder));

	return res;
    }

    // Copies the folder in `src_folder_path' in to
    // `dest_folder_path'.  If you need to copy folder *contents*, use
    // `CopyFolderContentsToFolder' instead.
    CopyFolderInToFolder (src_folder_path, dest_folder_path, opts) {

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

	// Easy - the destination doesn't contain a folder with this name.
	if (!dest_folder.HasSubFolder(src_folder.Name)) {
	    let new_folder_obj = {};
	    Object.assign(new_folder_obj, src_folder);
	    return dest_folder.AddSubFolder(new_folder_obj);
	}

	// Is the destination folder the root volume?
	if (dest_folder.IsRootFolder) {

	    if (cwd_dst.SubFolders.some((x) => x.Name === cwd_dst.Name)) {
		// Fail! We can't add the sub folder as one already exists.
		console.log("=== root volume subfolder clash ===");
		return false;
	    }

	    // Let's add the folder!
	    let new_folder_obj = {};
	    Object.assign(new_folder_obj, src_folder);
	    return dest_folder.AddSubFolder(new_folder_obj);
	}

	// And now for the messy bit...
	var cwd_src = src_folder,
	    cwd_dst = dest_folder,
	    cont    = true;

	(function walk () {

	    // Do any files in src match any in dst?
	    let src_dst_files_uniq = cwd_src.Files.every((src_file) => {
		return cwd_dst.Files.every((dst_file) => {
		    return dst_file.Name === src_file.Name;
		});
	    });

	    if (src_dst_files_uniq === false) {
		// This means that a file with the same name exists
		// in the same directory.
		cont = false;
		console.log("=== filename collision ===");
		return false;
	    }

	    // Does the current `cwd_src' exist at this level?
	    let src_dir_name_exists_in_dst = cwd_dst.SubFolders.every(
		(dst_folder) => dst_folder.Name === cwd_src.Name
	    );

	    if (src_dir_name_exists_in_dst && opts.overwrite === false) {
		// Cannot continue - the `cwd_src' directory name was
		// found to clash with an existing foldername, and the
		// overwrite flag means we must not alter or replace it.
		cont = false;
		return false;
	    }

	    // TODO - here is where we overwrite..

	    if (cont) {
		// Do the hard bit of figure out how we prep the src/dst folders
		// for the next cycle.  Likely recursive.
	    }
	}());

	return cont;
    }

    ExpandPath (path) {

        if (is_relative(path)) {
            path = pathlib.join(this.context.get_env("Path"), path);
        }

        return pathlib.normalize(path);

    }

    Parse (path) {

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
    }

    CopyFileToFolder (src_file_path, dest_file_path, opts) {

	opts = opts || { overwrite: false };
	const overwrite = opts.overwrite;

        let src_file_parts = this.Parse(this.ExpandPath(src_file_path)),
            src_file_name  = src_file_parts.base;

        // Logic for coyping a file is:
        //
        //   - if a folder exists in DEST which matches the copied file's name
        //     THROW PERMISSION DENIED, for example:
        //
        //     DIR: "C:\\Foo", "C:\\Foo\\Bar".
        //     copy ("C:\\Foo\\file.txt", "C:\\Foo\\Bar") - perm denied.
        //     copy ("C:\\Foo\\file.txt", "C:\\Foo\\Bar\\") - copies 'file.txt' in to Bar.

        // Is the destination location a path or an actual file?
        if (opts.hasOwnProperty("destination_filename") === false) {
            opts.destination_filename = src_file_name;
        }
        else {
            let dst_path_parts = this.Parse(this.ExpandPath(dest_file_path));
            console.log("=-----", dst_path_parts);
        }

	dest_file_path = pathlib.join(dest_file_path, opts.destination_filename);

	// First, make sure the source file actually exists...
	let src_file = this.GetFile(src_file_path);

	if (!src_file) {
            throw new Error("Source file not found");
	    return false;
	}

        // TODO: Add auto-vivification here.
        if (! this.FolderExists(dest_file_path)) {
            throw new Error("Destination folder not found");
        }

	// Second, we shouldn't overwrite the file if it already exists..
	if (this.GetFile(dest_file_path) && overwrite === false) {
	    console.log(`Cannot copy ${src_file_path}`,
			`to ${dest_file_path} - dst file exists and `,
			`overwrite is ${overwrite}.`);
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
