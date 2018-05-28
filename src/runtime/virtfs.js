const FolderObject = require("../winapi/FolderObject");
const FileObject   = require("../winapi/FileObject");
const win32path    = require("path").win32;
const memfs        = require("memfs").fs;
const Volume       = require("memfs").Volume;
var   rewire       = require("rewire");
var   proxyquire   = require("proxyquire");

//
// Construct Virtual File System Design
// ====================================
//
// The Virtual File System (VFS) is designed to mimic a Windows host,
// right down to the last detail.  Much of the detail, such as
// throwing correct exceptions (with the correct message and number)
// is handled higher up by the WINAPI modules themselves.  Under the
// hood, any WINAPI module wishing to interact with the file system
// goes through the public interface exposed here.
//
// This outline aims to set clear expectations of what WINAPI modules
// can expect from the VFS, and what the VFS expects of WINAPI
// modules.
//
//
// File System Organisation
// ~~~~~~~~~~~~~~~~~~~~~~~~
//
// By design, the Construct VFS only supports the "C:" volume as this
// keeps things simple.  Due to the way the underlying `memfs' module
// works, paths are stored much like Unix paths, with disk designators
// removed and all backslashes replaced to forward slashes.  This is
// an internal representation only, and all paths should be correctly
// formatted before being returned.  For example:
//
//   "C:\Foo\BAR.TXT" --[ BECOMES ]--> "/foo/bar.txt"
//
// Notice that the disk designator is removed and the whole path is
// lower-cased.  The lower casing is a feature of NTFS.  To correctly
// reconcile a mixed case path, we maintain a lookup table which
// maps external paths to those used internally by Construct.
//
//
// Synchronous vs. Asynchronous
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Construct does not support asynchronous file access.  All file
// system operations are performed synchronously.
//
//
// Paths
// ~~~~~
//
// Paths on Windows are a mess.  A *REAL* mess.  Construct tries to
// organise this chaos by laying down the following edicts.  For
// berevity, the collective noun "files" shall refer to files and
// directories unless otherwise stated.
//
// CONTRACT
//
//   - Most methods exported by the VFS will operate only on absolute
//     paths, with the exception being the methods designed to
//     normalise and expand paths.
//
//   - Wildcards are not supported by any of the VFS methods which
//     directly access the virtual FS.  Dedicated methods exist for
//     expanding a wildcard expression in to a set of files which
//     match the expression.  These methods should be called to build
//     a list of files, then each file is "applied" to the FS.
//
//   - The accepted path types are:
//
//       Extended Paths :: \\?C:\foo\bar\baz
//       Absolute Paths :: C:\foo\bar\baz
//
//     All other path types are NOT supported.  This includes:
//
//       UNC Paths               :: \\192.168.1.1\foo\bar\baz
//       Win32 Device Namespaces :: \\.\COM1
//
//   - Environment variable expansion is handled by the VFS, but only
//     via the `ExpandEnvironmentStrings' and `Resolve' methods.  No
//     other VFS methods know anything about ENV vars.  This follows
//     Windows' behaviour.
//
class VirtualFileSystem {

    constructor(context) {

	this.context = context;
        this.ee = this.context.emitter;
        this.epoch = context.epoch;

        this.volumes = {
            "c": new Volume
        };

        this.extern_to_intern_paths = {};

        this.volume_c = this.volumes.c;
        this.vfs = this.volume_c;

        this._InitFS();
    }

    // [PRIVATE] InitFS
    // ================
    //
    // Handles VFS setup when the VFS is constructed.  Responsible for
    // loading paths from the Construct config, as well as setting up
    // a base file system.
    //
    _InitFS () {

        // .TODO1
        // The VFS does not load any paths from a configuration file.
        // When this feature is added, this method will handle this.
        // .TODO2

        // .TODO1
        // There's currently a limitation with the VFS where NTFS
        // {m,a,c,e} times are not derived from the epoch.  This needs
        // to be updated so that we don't get weird file metadata when
        // running under a different timestamp.
        // .TODO2

        const basic_fs_setup = [
            "C:\\Users\\Construct\\Desktop",
            "C:\\Users\\Construct\\My Documents"
        ];

        basic_fs_setup.forEach(p => this.vfs.mkdirpSync(this._ToInternalPath(p)));
    }

    // [PRIVATE] ToInternalPath
    // ========================
    //
    // Given an `extern_path', so named because it's the path known to
    // the JScript we're running, convert the path to its internal
    // representation.  This includes performing the following
    // alterations:
    //
    //   - Lower-casing the entire path.
    //   - Removing the disk designator.
    //   - Switch all \ separators to /.
    //
    _ToInternalPath (extern_path) {

        let internal_path = extern_path
            .toLowerCase()
            .replace(/^[a-z]:/ig, "")
            .replace(/\\/g, "/");

        this.extern_to_intern_paths[extern_path] = internal_path;
        return internal_path;
    }

    // GetVFS
    // ======
    //
    // Returns a JSON representation of the VFS.
    //
    GetVFS () {
        return this.vfs.toJSON();
    }

    //
    // =========================================
    // P A T H   S P E C I F I C   M E T H O D S
    // =========================================
    //
    // This family of methods operate only on paths and do not
    // interact with the underlying filesystem in any way.
    //
    // For information on Windows paths and filenames, the following
    // MSDN article has proved most useful:
    //
    //   https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx
    //
    BuildPath (existing_path, new_path_part) {

        if (/^[a-z]:$/i.test(existing_path) || /[\\/]$/.test(existing_path)) {
            return `${existing_path}${new_path_part}`;
        }

        return `${existing_path}\\${new_path_part}`;
    }

    // PathIsAbsolute
    // ==============
    //
    // Queries the given `path' and will return TRUE if `path' appears
    // to be absolute, or FALSE for everything else.
    //
    // From the MSDN article (given above), all of the following are
    // considered relative to the current directory if the path does
    // not begin with one of the following:
    //
    //   - A UNC name of any format, which always start with two
    //     backslash characters ("\\").
    //
    //   - A disk designator with a backslash, for example "C:\" or
    //     "d:\".
    //
    //   - A single backslash, for example, "\directory" or
    //     "\file.txt". This is also referred to as an absolute path."
    //
    PathIsAbsolute (path) {

        // While not strictly part of the path, paths beginning "\\?\"
        // indicate that the path should be passed to the system with
        // minimal modification.
        //
        //  \\?\C:\Windows\System32\test.dll
        //
        if (/^\\\\\?\\/.test(path)) return true;

        // A UNC path is always considered absolute.  UNC paths begin
        // with a double backslash:
        //
        //   \\hostname\foo\bar.txt
        //
        if (/^\\./i.test(path)) return true;


        // An absolute path can be identified as beginning with a disk
        // designator, followed by a backslash:
        //
        //   C:\foo.txt
        //   d:\bar\baz.txt
        //
        if (/^[a-z]:\\/i.test(path)) return true;

        return false;
    }

    // PathIsRelative
    // ==============
    //
    // Queries the given `path' and returns TRUE if the path appears
    // to be relative, or FALSE for everything else.
    //
    PathIsRelative (path) {
        // Rather than trying to detect if a path is relative, we just
        // test if its absolute and return the opposite.
        return !this.PathIsAbsolute(path);
    }

    // ExpandEnvironmentStrings
    // ========================
    //
    // Given a `path', will attempt to replace all instances of
    // environment strings.
    //
    ExpandEnvironmentStrings (str) {

        // Environment variables are strings enclosed between
        // percentage characters, such as:
        //
        //   - %PATH%
        //   - %APPDATA%
        //   - %COMSPEC%
        //
        // We will only expand the vars.  If a variable cannot be
        // found, it will be left as-is.  We won't validate the
        // expanded form is even a valid path.
        //
        const env_var_regexp = /%[a-z0-9_]+%/ig;

        let match = env_var_regexp.exec(str);

        while (match !== null) {

            let env_var_symbol = match[0].toLowerCase().replace(/%/g, ""),
                env_var_value  = this.context.get_env(env_var_symbol) || match[0];

            str = str.replace(new RegExp(match[0], "gi"), env_var_value);
            match = env_var_regexp.exec(str);
        }

        return str;
    }

    // ExpandPath
    // ==========
    //
    // This method accepts an incoming `pathspec' and attempts to
    // expand the pathspec.  Pathspec expansion includes:
    //
    //   - Environment variable expansion and replacement.
    //   - Wildcard matching.
    //   - Path normalisation.
    //
    ExpandPath (pathspec, opts) {

    }

    // Normalise
    // =========
    //
    // Given a relative path, `Normalise' will attempt to normalise
    // the path, meaning all '..' and '.' segments are resolved, and
    // path separator values are changed from '/' to '\'.
    //
    // Environment variables will not be expanded by Normalise.
    //
    Normalise (path) {
        return win32path.normalize(path);
    }


    // Parse
    // =====
    //
    // Parse returns a structure whose elements represent the
    // significant parts of the supplied `path'.  The returned
    // structure is a dictionary with the following entries:
    //
    //   * dir
    //   * root
    //   * base
    //   * name
    //   * ext
    //
    // For example (from https://nodejs.org/api/path.html#path_path_parse_path):
    //
    //   vfs.Parse('C:\\path\\dir\\file.txt');
    //   {
    //     root: 'C:\\',
    //     dir:  'C:\\path\\dir',
    //     base: 'file.txt',
    //     ext:  '.txt',
    //     name: 'file'
    //   }
    //
    Parse (path) {
        return win32path.parse(path);
    }


    // Resolve
    // =======
    //
    // Path resolution is an attempt to make a relative path absolute.
    // The resolver accepts almost any path type and will make a
    // best-effort attempt to resolve the incoming path.
    //
    // Environment variables are expanded if they can be found, else
    // they are left as-is.
    //
    // Wildcards are considered a path expression, not a path, so they
    // are ignored.
    //
    // .TODO
    // More thought is needed about how to handle wildcards
    // passed to the resolver.
    // .TODO
    //
    Resolve (path) {

        path = this.ExpandEnvironmentStrings(path);
        path = this.Normalise(path);

        if (this.PathIsRelative(path)) {

            // Special case handling for instances where we see disk
            // designator followed by a file or folder name, for
            // example:
            //
            //   C:foo.txt
            //   C:..\Users
            //
            if (/^[a-z]:[^\\]/i.test(path)) {
                // .CAVEAT1
                // In our Construct environment the only accessible
                // volume is 'C:'.  Therefore, if a path coming in
                // uses a disk designator other than 'c:', we'll
                // rewrite the path so that it starts 'c:'.
                // .CAVEAT2

                // Delete the disk designator (so "c:" or "d:", ...).
                // We'll replace this with our ENV CWD path shortly.
                path = path.replace(/^[a-z]:/i, "");
            }

            path = win32path.join(this.context.get_env("path"), path);
        }

        return this.Normalise(path);
    }



    //
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !! All methods from this point on operate only on absolute paths !!
    // !! as discussed in the design document at the top of this file.  !!
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    //

    // CopyFile
    // ========
    //
    // Copies the file from `source' to `destination'.  By default,
    // `destination' is overwritten if it already exists.  Destination
    // must be an absolute filepath, and not just a path to a folder.
    // To copy a file in to a folder, see `CopyFileToFolder'.
    //
    CopyFile (source, destination, opts) {

        const isource      = this._ToInternalPath(source),
              idestination = this._ToInternalPath(destination);

        opts = opts || {};

        var flags = 0;

        if (opts.overwrite === false) {
            flags = memfs.constants.COPYFILE_EXCL;
        }

        this.vfs.copyFileSync(isource, idestination, flags);
    }

    CopyDirectoryStructure (source, destination) {

    }

    // ReadFileContents
    // ================
    //
    // Reads and returns the file contents.  If `encoding' is
    // supplied, will attempt to decode the file contents according to
    // the encoding scheme.  If no encoding is set a Buffer is
    // returned.
    //
    ReadFileContents (filepath, encoding) {

        const ipath = this._ToInternalPath(filepath),
              buf   = this.vfs.readFileSync(ipath, encoding);

        return buf;
    }

    // FileExists
    // ==========
    //
    // Tests if the given filepath exists.  The value of
    // auto-vivification does not alter the behaviour of this method.
    //
    // .TODO1
    // Investigate whether auto-vivification should be considered when
    // asking if a file exists.  I believe it should be used, but this
    // needs some research.
    // .TODO2
    //
    FileExists (filepath) {

        try {
            this.vfs.accessSync(this._ToInternalPath(filepath));
            return true;
        }
        catch (_) {
            return false;
        }
    }

    // FolderExists
    // ============
    //
    // Tests if the given folder path exists, returning true if it
    // does, and false otherwise.  Auto-vivification does not alter
    // the behaviour of this method.
    //
    // .TODO1
    // Investigate whether auto-vivification should be applied to
    // folders.  The result of folders should match whatever is
    // decided for files.
    // .TODO2
    //
    FolderExists (folderpath) {

        try {
            this.vfs.accessSync(this._ToInternalPath(folderpath));
            return true;
        }
        catch (_) {
            return false;
        }
    }

    // AddFile
    // =======
    //
    // Previous versions of Construct used the method `AddFile' to add
    // files to the VFS.  This method is added to match this
    // functionality, however new code really should use `WriteFile'.
    //
    AddFile (filepath, data, options) {

        let ipath = this._ToInternalPath(filepath);
        this.vfs.writeFileSync(ipath, data, options);
    }

    // DeleteFile
    // ==========
    //
    // Removes the file.
    //
    DeleteFile (filepath) {

        const ipath = this._ToInternalPath(filepath);
        this.vfs.unlinkSync(ipath);
    }

    // Rename
    // ======
    //
    // Renames a given `source' to `destination'.
    //
    Rename (source, destination, options) {

        const isource      = this._ToInternalPath(source),
              idestination = this._ToInternalPath(destination);

        this.vfs.renameSync(isource, idestination);
    }

    // MoveFolder
    // ==========
    //
    // Moves a `source' folder to a `destination'.  All internal files
    // and folders are also moved.
    //
    CopyFolder (source, destination) {

        let isource      = this._ToInternalPath(source),
            idestination = this._ToInternalPath(destination);

        let vfs = this.vfs;

        if (vfs.statSync(isource).isDirectory() && ! /\/$/.test(isource)) {
            try {
                vfs.mkdirpSync(`${idestination}/${isource}`);
            }
            catch (_) {}

            isource      = `${isource}/`;
            idestination = `${idestination}/${isource}`;
        }

        function recursive_copy (isrc, idest) {

            let list_of_files  = vfs.readdirSync(isrc);

            list_of_files.forEach(f => {

                let isrc_this_file  = `${isrc}/${f}`,
                    idest_this_file = `${idest}/${f}`;

                if (vfs.statSync(isrc_this_file).isDirectory()) {

                    try {
                        vfs.mkdirpSync(idest_this_file);
                    }
                    catch (_) {
                        // Folder already exists, do nothing.
                    }

                    recursive_copy(isrc_this_file, idest_this_file);
                }
                else {
                    // This is a file...
                    vfs.copyFileSync(isrc_this_file, idest_this_file);
                }
            });
        }

        recursive_copy(isource, idestination);
    }

    // AddFolder
    // =========
    //
    // Creates a new directory tree.  If the path does not exist, and
    // auto-vivification is enabled, `AddFolder' will create the
    // entire folder path.
    //
    AddFolder (folderpath, options) {

        if (!this.FolderExists(folderpath)) {

            let ipath = this._ToInternalPath(folderpath);
            this.vfs.mkdirpSync(ipath);
        }
    }

    // GetFile
    // =======
    //
    // If the supplied `path' represents a file, then a WINAPI
    // FileObject instance is returned.  If the file cannot be found,
    // then false is returned.
    //
    GetFile (filepath) {

        let ipath = this._ToInternalPath(filepath);

        let filebuf = this.vfs.readSync(ipath);

        console.log(filebuf);
    }


    WriteFile (path, data, options) {

        // TODO: Make use of fs.utimesSync(path, atime, mtime)
        // for altering file {m,a,c,e} times.
        this.volume_c.writeFileSync(path, data, options);
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

    /*_NormaliseFilename (filename) {

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

    GetFilename (path) {
        return this.Parse(this.ExpandPath(path)).base;
    }


    GetFolder (path) {

	let parsed_path = this.Parse(path);

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

    // * Given a source folder path and a folder destination, this method
    // * copies the contents of src in to the destination.  For example, consider
    // * the src dir to be called `foo', and it contains one file `bar.txt', and
    // * our destination -- `baz.txt'.  Calling CopyFolderContentsToFolder(src, dst)
    // * will copy `bar.txt' in to `baz'.
    //
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

    //
    // ThrowIfInvalidPath
    // ==================
    //
    // Performs path validation.  If the `path' is valid,
    // `ValidatePath' returns `null'.  However, if the path is
    // invalid, it raises an exception.
    //
    //
    ThrowIfInvalidPath (path, options) {

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

    Parse (path) {

	// Replace all forward slashes with back slashes...
	path = path.replace(/\//, "\\").toLowerCase();
	path = path.replace(/\\\\/, "");

	let ends_with_path_sep = /[\\/]$/.test(path);

        path = path.replace(/[\\/]+$/, "");

        // Experimental
        let norm_path = this.ExpandPath(path);

        try {
	    var parsed_path   = pathlib.parse(norm_path),
	        path_parts    = parsed_path.dir.split(/\\/),
	        volume_letter = parsed_path.root.replace(/\\/g, "").toLowerCase();
        }
        catch (e) {

        }

	parsed_path.volume             = volume_letter;
	parsed_path.assumed_folder     = ends_with_path_sep;
        parsed_path.normalised         = this.ExpandPath(path);
        parsed_path.assumed_relative   = is_relative(path);
	parsed_path.orig_path          = path;
	parsed_path.orig_path_parts    = path.split("\\").filter(x => x !== "");
	parsed_path.orig_path_parts_mv = parsed_path.orig_path_parts.slice(1);

	return parsed_path;
    }

    CopyFile (src_path, dest_path, opts) {

        opts = opts || { overwrite: true };

        // TODO: Validate that the dest_file does not contain illegal
        // characters...

        let parsed_src_path  = this.Parse(src_path),
            parsed_dest_path = this.Parse(dest_path),
            dest_obj         = null;

        if (parsed_dest_path.assumed_folder) {
            dest_obj = this.GetFolder(parsed_dest_path.normalised);
        }
        else {
            dest_obj = this.GetFile(parsed_dest_path.normalised);
        }

        let src_file_obj = this.GetFile(parsed_src_path.normalised),
            overwrite    = parsed_src_path.base === parsed_dest_path.base;

        if (parsed_dest_path.assumed_folder === false && dest_obj) {
            return this.CopyFileToFolder(
                parsed_src_path.normalised,
                parsed_dest_path.dir,
                Object.assign(opts, { dest_filename: parsed_dest_path.base })
            );
        }
        else if (parsed_dest_path.assumed_folder && dest_obj) {
            return this.CopyFileToFolder(parsed_src_path.normalised, parsed_dest_path.normalised);
        }
        else if (src_file_obj === false) {
            throw new Error("Source file not found");
        }
        else if (dest_obj === false) {
            throw new Error("Destination folder not found");
        }
        else if (dest_obj) {
            // Here? Then the file is a folder. Throw a permission
            // denied message.
            throw new Error("Cannot copy file - destination name is ambiguous");
        }

        return false;
    }


    CopyFileToFolder (src_file_path, dest_file_path, opts) {

        opts = opts || { overwrite: false };
        const overwrite = opts.overwrite;

        let src_file_name = pathlib.basename(src_file_path);

        if (opts.hasOwnProperty("dest_filename")) {
            dest_file_path = pathlib.join(dest_file_path, opts.dest_filename);
        }
        else {
            dest_file_path = pathlib.join(dest_file_path, src_file_name);
        }

        // First, make sure the source file actually exists...
        let src_file = this.GetFile(src_file_path);

        if (!src_file) {
            console.log(`Cannot copy ${src_file_path}`,
                        `to ${dest_file_path} - file not found.`);
            return false;
        }

        // Second, we shouldn't overwrite the file if it already exists..
        if (this.GetFile(dest_file_path) && overwrite === false) {
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
    }*/
}

module.exports = VirtualFileSystem;
