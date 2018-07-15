const FolderObject = require("../winapi/FolderObject");
const FileObject   = require("../winapi/FileObject");
const win32path    = require("path").win32;
const wildcard     = require("./wildcard");
const memfs        = require("memfs").fs;
const linkfs       = require("linkfs").link;
const Volume       = require("memfs").Volume;
const md5          = require("md5");

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
// translated on the way in, as well as on the way out. For example:
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
//   - Short filenames (in 8.3 form) are supported.  Some of the
//     handling surrounding 8.3 names gets weird once there's ~10
//     similar files in the name, as we use a mixture of hash and
//     hope.  Not great.
//

function make_mem_ntfs_proxy (memfs) {

    // Maps the 'ino' (inode) value from a `memfs' file/folder to
    // their associated name, cased  correctly.
    let orig_filename_case = {};

    let memfs_sans_proxy = memfs;
    let shortname_num = 0;

    // is_shortname
    // ============
    //
    // Returns TRUE if the given path-part looks as though it could be
    // a shortfile name, otherwise returns FALSE.  There is a caveat
    // which says that just because the `path_part' is a *valid*
    // shortname, it does not mean that the shortname definitely
    // exists.
    //
    function is_shortname (filename) {
        return wildcard.is_shortname(filename);
    }

    // generate_shortname
    // ==================
    //
    // Implements part of the algorithm associated with converting a
    // long filename (LFN) to a short filename (SFN).  Has no
    // knowledge of the filesystem -- it will just create a shortname
    // from the long filename given to it.  Use the `opts' hash to
    // configure behaviour, such as whether the shortname should be a
    // hashed version of the name.
    //
    function generate_shortname (filename, opts) {

        opts = opts || { index: 1, hashed: false };

        filename = filename.toLowerCase();

        // Extensions are optional.
        let extension = win32path.extname(filename),
            namepart  = win32path.basename(filename, extension);

        // Extension *includes* the DOT, hense why we substr(0, 4).
        if (extension.length >= 3) extension = extension.substr(0, 4);

        let filename_length_before_dot_strip = namepart.length;

        //  Commas, square brackets, semicolons, equals signs (=),
        //  and plus signs (+) are all converted to an underscore.
        namepart = namepart.replace(/[,\[\];=+]/g, "_");

        // All spaces are removed.
        namepart = namepart.replace(/\s+/g, "");

        // All periods are removed.
        namepart = namepart.replace(/\./g, "");

        if (opts.hashed === true) {
            // We usually end up here if there's been a filename
            // collision and we need to revert to using a hash in the
            // filename.  We need to truncate the filename to (at
            // most) the first two letters of the namepart, followed
            // by four hexadecimal digits.
            namepart = namepart.substr(0, 2);
            // TODO: the filename is lower-cased...will this hurt us?
            let hashpart = md5(filename).substr(0, 4).toLowerCase();
            return namepart + hashpart + "~1" + extension;
        }

        // DEFAULT BEHAVIOUR:
        // If longer than eight characters, the file name is truncated
        // to the first six, followed by "~" and the opts.index:
        if (filename_length_before_dot_strip > 8) {
            namepart = namepart.substr(0, 6) + `~${opts.index}`;
        }

        return namepart + extension;
    }

    function get_symlinks_in_dir (path) {
        return memfs_sans_proxy
            .readdirSync(path)
            .filter(f => memfs_sans_proxy.lstatSync(`${path}/${f}`).isSymbolicLink());
    }

    // make_shortname_and_link
    // =======================
    //
    // Given an internal path to a file and folder, attempts to create
    // a SFN for each path part, observing the Windows rules
    // surrounding DOS 8.3 names, including name-collision handling.
    //
    function make_shortname_and_link (path) {

        let basename = win32path.basename(path),
            dirname  = win32path.dirname(path);

        // Early-out if there is no need to create a shortlink because
        // the name is too short.
        if (is_shortname(basename)) {
            return;
        }

        // A symlink which points-to `path' may already exist...
        let symlinks = get_symlinks_in_dir(dirname);

        for (let i = 0; i < symlinks.length; i++) {

            let target = memfs_sans_proxy.readlinkSync(`${dirname}/${symlinks[i]}`);

            if (target.toLowerCase() === path.toLowerCase()) {
                // Match!  This means a symlink already points-to
                // `path', so we've no work left to do.
                return;
            }
        }

        for (let i = 1; i <= 4; i++) {

            let possible_shortname_lnk = generate_shortname(basename, { index: i });

            let lnk_path = (dirname === "/")
                    ? `/${possible_shortname_lnk}`
                    : `${dirname}/${possible_shortname_lnk}`;


            try {
                memfs_sans_proxy.symlinkSync(path, lnk_path, "junction");
                return;
            }
            catch (e) {
            }
        }

        // If we haven't exited this function by now, it means there
        // are already four shortname files present in this dir, so we
        // switch from using numbers in the shortname to parts of a hash.
        for (let i = 0; i < 10; i++) {

            let sn_hashed_lnk = generate_shortname("" + basename + i, { hashed: true}),
                lnk_path = (dirname === "/")
                    ? `/${sn_hashed_lnk}`
                    : `${dirname}/${sn_hashed_lnk}`;

            try {
                memfs_sans_proxy.symlinkSync(path, lnk_path, "junction");
                return;
            }
            catch (e) {
            }
        }
    }

    // ntfs_mkdirSync
    // ==============
    //
    function ntfs_mkdirSync (path, mode) {

        // A wrapper around `fs.mkdirSync' which will create a symlink
        // with a shortname which points-to the directory being
        // created.
        memfs_sans_proxy.mkdirSync(path, mode);
        make_shortname_and_link(path);
    };

    // ntfs_mkdirpSync
    // ===============
    //
    // Construct supports auto-creating folders as soon as they're
    // asked for.  This method is the main way in which this is
    // achieved.  It's actually not a core `node(fs)' function -- it's
    // a convenience function exported by `memfs'.
    //
    function ntfs_mkdirpSync (path) {

        memfs_sans_proxy.mkdirpSync(path);

        // Assuming that worked, we need to walk the newly created
        // path and add symlinks for each path-part.
        let path_parts = path.split("/").filter(p => !!p);
        curr_path = "/";

        path_parts.forEach(part => {
            curr_path += (curr_path === "/")
                ? part
                : `/${part}`;
            make_shortname_and_link(curr_path);
        });
    }

    // ntfs_writeFileSync
    // ==================
    //
    function ntfs_writeFileSync (path, data, options) {

        path = ntfs_realpathSync(path);

        const dirname = win32path.dirname(path);
        ntfs_mkdirpSync(dirname);

        if (data === null || data === undefined) data = "";

        let ret = memfs_sans_proxy.writeFileSync(path, data, options);
        make_shortname_and_link(path);
    }

    // ntfs_realpathSync
    // =================
    //
    function ntfs_realpathSync (path, options) {

        function resolve_symlinks (path) {

            let path_parts = path.split("/").filter(f => !!f),
                final_path = "",
                curr_path  = "";

            for (let i = 0; i < path_parts.length; i++) {

                let part = path_parts[i];

                let tmp_path = (curr_path === "/")
                        ? `/${part}`
                        : `${curr_path}/${part}`;

                try {
                    let symlink_points_to    = memfs_sans_proxy.readlinkSync(tmp_path),
                        remaining_path_parts = path_parts.slice(i+1).join("/");

                    if (!remaining_path_parts) {
                        return tmp_path;
                    }

                    return ntfs_realpathSync([symlink_points_to, remaining_path_parts].join("/"));
                }
                catch (e) {
                    curr_path = `${curr_path}/${part}`;
                }
            }

            return curr_path;
        }

        // There is a chance the file may not exist...
        try {
            path = memfs_sans_proxy.realpathSync(resolve_symlinks(path), options);
        }
        catch (e) {
            if (e.code === "ENOENT") {
                // It is totally legal for a path not to exist,
                // despite all of our efforts in trying to resolve it.
                //
                // We shall just return the path and let the caller
                // deal with it.
            }
        }

        return path;
    }

    // ntfs_readdirSync
    // ================
    //
    // Reads the contents of PATH and filters all symlinks
    // (shortnames) from the results.  To get all files in the dir
    // (including links) set options.include_links to TRUE.
    //
    function ntfs_readdirSync (path, options) {

        options = options || { include_links: false };

        path = ntfs_realpathSync(path);

        let dir_contents = memfs_sans_proxy.readdirSync(path);

        if (dir_contents.length === 0) return [];

        if (options.include_links) return dir_contents;

        // Filter out all sym links
        return dir_contents.filter(f => {
            return ! memfs_sans_proxy
                .lstatSync(`${path}/${f}`)
                .isSymbolicLink();
        });
    }

    // ntfs_renameSync
    // ===============
    //
    function ntfs_renameSync (old_path, new_path) {

        const old_path_dirname  = win32path.dirname(old_path),
              links_to_old_path = get_symlinks_in_dir(old_path_dirname);

        memfs_sans_proxy.renameSync(old_path, new_path);

        get_symlinks_in_dir(old_path_dirname)
            .forEach(link => {
                const linkpath = `${old_path_dirname}/${link}`,
                      linkstr  = memfs_sans_proxy.readlinkSync(linkpath).toLowerCase();

                if (linkstr.toLowerCase() === old_path.toLowerCase()) {
                    memfs_sans_proxy.unlinkSync(linkpath);
                }
            });

        make_shortname_and_link(new_path);
    }

    // ntfs_copyFileSync
    // =================
    //
    function ntfs_copyFileSync (src_path, dest_path, flags) {
        memfs_sans_proxy.copyFileSync(src_path, dest_path, flags);
        make_shortname_and_link(dest_path);
    }

    // ntfs_unlinkSync
    // ===============
    //
    function ntfs_unlinkSync (path) {

        memfs_sans_proxy.unlinkSync(path);

        const folder_above_path = win32path.dirname(path);

        get_symlinks_in_dir(folder_above_path)
            .forEach(link => {
                const linkpath = `${folder_above_path}/${link}`,
                      linkstr  = memfs_sans_proxy.readlinkSync(linkpath).toLowerCase();

                if (linkstr.toLowerCase() === path.toLowerCase()) {
                    memfs_sans_proxy.unlinkSync(linkpath);
                }
            });
    }

    // ntfs_findFiles
    // ==============
    //
    // Construct's implementation of the Windows wildcard matching.
    // Based around the behaviours of the WINAPI FindFirstFile
    // function.
    //
    function ntfs_findFiles (path, pattern) {

        let folder_contents = memfs_sans_proxy.readdirSync(path),
            matched         = matcher.match(folder_contents, pattern);


    }

    const ntfs_fn_dispatch_table = {
        mkdirpSync:    ntfs_mkdirpSync,
        mkdirSync:     ntfs_mkdirSync,
        writeFileSync: ntfs_writeFileSync,
        readdirSync:   ntfs_readdirSync,
        renameSync:    ntfs_renameSync,
        unlinkSync:    ntfs_unlinkSync,
        realpathSync:  ntfs_realpathSync,
        copyFileSync:  ntfs_copyFileSync,
        // ==============================
        // Non-standard `fs' functions
        // ==============================
        readdirSymlinks: get_symlinks_in_dir
    };

    return new Proxy(memfs, {

        get: function (target, propkey) {

            if (ntfs_fn_dispatch_table.hasOwnProperty(propkey)) {
                return ntfs_fn_dispatch_table[propkey];
            }

            return memfs_sans_proxy[propkey];
        }
    });
};


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
        this.vfs = make_mem_ntfs_proxy(this.volume_c);

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

        // .TODO1
        // It looks as though on a WIN7 system, there's no
        // "C:\Users\BLAH\My Documents" folder (just "Documents"),
        // however it's still possible to `cd' in to "My Documents".
        // Needs more investigation to see WTF is going on.
        // .TODO2
    }


    // [PRIVATE] ConvertExternalToInternalPath
    // =======================================
    //
    // Given an `extern_path', so named because it's the path known to
    // the JScript we're running, convert the path to its internal
    // representation.
    //
    //   - Lower-casing the entire path.
    //   - Removing the disk designator.
    //   - Switch all \ separators to /.
    //
    _ConvertExternalToInternalPath (extern_path) {

        let internal_path = extern_path
                .toLowerCase()
                .replace(/^[a-z]:/ig, "")
                .replace(/\\/g, "/");

        try {
            let ipath_expanded = this.vfs.realpathSync(internal_path);
            return ipath_expanded;
        }
        catch (e) {
            //console.log(e);
            return internal_path;
        }
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


    // IsWildcard
    // ==========
    //
    // Returns TRUE if NAME appears to be a wildcard, else returns FALSE.
    //
    IsWildcard (name) {
        return /[*<>"?]/g.test(name);
    }

    // BuildPath
    // =========
    //
    // Given an `existing_path', appends the `new_path_part' to it.
    // Behaviour is copied from the FileSystemObject's BuildPath
    // method with regards to when folder separators are added.
    //
    BuildPath (win_existing_path, win_new_path_part) {

        if (/^[a-z]:$/i.test(win_existing_path) || /[\\/]$/.test(win_existing_path)) {
            return `${win_existing_path}${win_new_path_part}`;
        }

        return `${win_existing_path}\\${win_new_path_part}`;
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
    PathIsAbsolute (win_path) {

        // While not strictly part of the path, paths beginning "\\?\"
        // indicate that the path should be passed to the system with
        // minimal modification.
        //
        //  \\?\C:\Windows\System32\test.dll
        //
        if (/^\\\\\?\\/.test(win_path)) return true;

        // A UNC path is always considered absolute.  UNC paths begin
        // with a double backslash:
        //
        //   \\hostname\foo\bar.txt
        //
        if (/^\\./i.test(win_path)) return true;

        // An absolute path can be identified as beginning with a disk
        // designator, followed by a backslash:
        //
        //   C:\foo.txt
        //   d:\bar\baz.txt
        //
        if (/^[a-z]:\\/i.test(win_path)) return true;

        return false;
    }

    // PathIsRelative
    // ==============
    //
    // Queries the given `path' and returns TRUE if the path appears
    // to be relative, or FALSE for everything else.
    //
    PathIsRelative (win_path) {
        // Rather than trying to detect if a path is relative, we just
        // test if its absolute and return the opposite.
        return !this.PathIsAbsolute(win_path);
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

    // IsPathIllegal
    // =============
    //
    // Checks the entire `path' for the presence of any of the
    // following chars:
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
    IsPathIllegal (path) {

        let path_parts = path
            .replace(/^[a-z]:/i, "")
            .replace(/\\/g, "/")
            .split("/")
            .filter(f => !!f);

        return path_parts.some(p => /[<>:"\/\\\|?*]/g.test(p));
    }

    // IsFilespecIllegal
    // =================
    //
    // Checks if the given filename is valid.  All wildcard characters
    // are considered "legal" characters.
    //
    IsFilespecIllegal (filespec) {
        // TODO: figure out what other chars make this path illegal.
        return /[:\|]/g.test(filespec);
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
    // !!                                                               !!
    // !! NOTE: MS-DOS style shortnames are considered absolute paths.  !!
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    //

    // ShortPath
    // =========
    //
    // Given an absolute path to a file or folder, returns the complete
    // path in DOS 8.3 format.  Includes the drive designator.
    //
    ShortPath (path) {

        const ipath = this._ConvertExternalToInternalPath(path),
              parts = ipath.split("/").filter(p => !!p);

        if (path.toLowerCase() === "c:\\") return path;

        var pathstr   = "",
            shortpath = ["C:"];

        do {
            pathstr += `/${parts.shift()}`;
            shortpath.push(this.GetShortName(pathstr));
        } while (parts.length);

        return shortpath.join("\\");
    }

    // FolderContentsSize
    // ==================
    //
    // Walks from the given path through each file and folder and
    // computes the total size (in bytes) of all folders and files
    // below the given path.
    //
    FolderContentsSize (start_dir_path) {

        const ipath = this._ConvertExternalToInternalPath(start_dir_path);

        if (! this.FolderExists(ipath)) {
            throw new Error("Path not found");
        }

        let total_file_size = 0;

        let walk = (path) => {

            let folders = this.FindAllFolders(path),
                files   = this.FindAllFiles(path);

            if (folders.length) {

                for (let i = 0; i < folders.length; i++) {
                    walk(`${path}/${folders[i]}`);
                }
            }

            files.forEach(f => {
                let stats = this.Stats(`${path}\\${f}`);
                total_file_size += stats.size;
            });
        };

        walk(start_dir_path);

        return total_file_size;
    }

    // GetFileSize
    // ===========
    //
    // Given a path to a file, returns that file's size in bytes.
    //
    GetFileSize (path_to_file) {

        const ipath = this._ConvertExternalToInternalPath(path_to_file);

        try {
            let stats = this.Stats(ipath);
            return stats.size;
        }
        catch (e) {
            console.log(e.message);
            return -1;
        }
    }

    // Find
    // ====
    //
    // Given an absolute path to a directory in which to hunt for files
    // and folders, and the search pattern (a wildcard expression),
    // returns an array of names for each matching file or folder.
    //
    // If find matches a symlink (shortname), the name is expanded to the
    // long-filename version.
    //
    //
    Find (search_dir_path, pattern, options) {

        options = options || { files: true, folders: true, links: true };

        const isearch_path = this._ConvertExternalToInternalPath(search_dir_path);

        if (!this.FolderExists(isearch_path)) {
            return [];
        }

        const dir_contents  = this.vfs.readdirSync(isearch_path, { include_links: true }),
              matched_files = wildcard.match(dir_contents, pattern);

        if (matched_files.length === 0) return [];

        let item_list = [];

        for (let i = 0;i < matched_files.length; i++) {

            let f = matched_files[i];

            let item_path = `${isearch_path}/${f}`,
                stats     = this.vfs.lstatSync(item_path);

            if (stats.isSymbolicLink(item_path)) {

                if (options.links) item_list.push(f);

                const linkptr = this.vfs.readlinkSync(`${isearch_path}/${f}`);

                item_path = linkptr;
                f         = win32path.basename(linkptr);

                stats = this.vfs.lstatSync(item_path);
            }

            if (stats.isFile(item_path) && options.files) {
                item_list.push(f);
            }
            else if (stats.isDirectory(item_path) && options.folders){
                item_list.push(f);
            }
        }

        return item_list.filter((elem, pos, arr) => arr.indexOf(elem) == pos);
    }

    // FindFolders
    // ===========
    //
    // Given an absolute path to a directory in which to search, and a
    // search pattern (wildcard expression), returns all folders matching
    // the given wildcard expression.
    //
    // If no folders match, returns the empty array.
    //
    FindFolders (search_dir_path, pattern) {
        return this.Find(search_dir_path, pattern, { files: false, folders: true });
    }

    // FindAllFolders
    // ==============
    //
    // Returns all folders in the given directory path.
    //
    FindAllFolders (search_dir_path) {
        return this.Find(search_dir_path, "*", { files: false, folders: true, links: false });
    }

    // FindAllFiles
    // ============
    //
    // Returns all files in the given directory path.
    //
    FindAllFiles (search_dir_path) {
        return this.Find(search_dir_path, "*", { files: true, folders: false, links: false });
    }

    // FindFiles
    // =========
    //
    // Given an absolute path to a directory in which to search, and the
    // search pattern (wildcard expression), returns an array of
    // names for each file that matches the pattern.  If the
    // match succeeds for a short filename, the link is translated and
    // the long filename only is returned.  Directories are not returned.
    //
    // OPTIONS
    // ~~~~~~~
    //
    //   * full_paths : BOOL (default #f), when set to true, returns
    //                  an absolute path to the file, not just the
    //                  filename.
    //
    FindFiles (search_dir_path, pattern, options) {

        const isearch_path = this._ConvertExternalToInternalPath(search_dir_path);

        if (!this.FolderExists(isearch_path)) {
            return [];
        }

        return this.Find(search_dir_path, pattern, {
            files   : true,
            links   : false,
            folders : false
        });
    }

    // CopyFile
    // ========
    //
    // Copies the file from `source' to `destination'.  By default,
    // `destination' is overwritten if it already exists.  Destination
    // must be an absolute filepath, and not just a path to a folder.
    // To copy a file in to a folder, see `CopyFileToFolder'.
    //
    CopyFile (win_source_path, win_dest_path, opts) {

        const isource      = this._ConvertExternalToInternalPath(win_source_path),
              idestination = this._ConvertExternalToInternalPath(win_dest_path);

        opts = opts || {};

        var flags = 0;

        if (opts.overwrite === false) {
            flags = memfs.constants.COPYFILE_EXCL;
        }

        this.vfs.copyFileSync(isource, idestination, flags);
    }

    // ReadFileContents
    // ================
    //
    // Reads and returns the file contents.  If `encoding' is
    // supplied, will attempt to decode the file contents according to
    // the encoding scheme.  If no encoding is set a Buffer is
    // returned.
    //
    ReadFileContents (filepath) {

        const ipath = this._ConvertExternalToInternalPath(filepath),
              buf   = this.vfs.readFileSync(ipath);

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

        let ipath = this._ConvertExternalToInternalPath(filepath);

        try {
            this.vfs.accessSync(this._ConvertExternalToInternalPath(ipath));
            return this.vfs.lstatSync(ipath).isFile();
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
    FolderExists (win_path, opts) {

        let ipath = this._ConvertExternalToInternalPath(win_path);

        try {
            this.vfs.accessSync(ipath);
            return this.vfs.lstatSync(ipath).isDirectory();
        }
        catch (_) {
            return false;
        }
    }

    // Stats
    // =====
    //
    // Given a path and returns the Stats object for the given
    // `path'.  If `path' is a symbolic link, the link is
    // followed and stats about the link's target are returned.
    //
    Stats (path) {

        let ipath = this._ConvertExternalToInternalPath(path);

        try {
            return this.vfs.statSync(ipath);
        }
        catch (e) {
            throw e;
        }
    }


    // AddFile
    // =======
    //
    // Previous versions of Construct used the method `AddFile' to add
    // files to the VFS.  This method is added to match this
    // functionality, however new code really should use `WriteFile'.
    //
    AddFile (win_filepath, data, options) {

        let ipath = this._ConvertExternalToInternalPath(win_filepath);

        if (this.IsPathIllegal(win_filepath)) {
            throw new Error(`Invalid filepath: '${win_filepath}'`);
        }

        this.vfs.writeFileSync(ipath, data, options);
    }

    // Delete
    // ======
    //
    // Recursively removes the file or folder identified by "path".
    //
    Delete (filepath) {
        const ipath = this._ConvertExternalToInternalPath(filepath);

        if (this.IsFile(ipath)) {
            return this.vfs.unlinkSync(ipath);
        }

        try {
            return this.vfs.unlinkSync(ipath);
        }
        catch (e) {

            if (! e.message.includes("Dir not empty")) {
                throw e;
            }
        }

        // We know that the folder we want to unlink contains nested
        // files/folders.  Let's delete all of them and finally remove
        // this top-level folder.
        let walk = (path) => {

            let folders = this.FindAllFolders(path),
                files   = this.FindAllFiles(path);

            if (folders.length) {
                for (let i = 0; i < folders.length; i++) {
                    walk(`${path}/${folders[i]}`);
                }
            }

            files.forEach(f => this.vfs.unlinkSync(`${path}/${f}`));
            return this.vfs.unlinkSync(path);
        };

        return walk(ipath);
    }

    // DeleteInFolderMatching
    // ======================
    //
    // Allows finer-grained control over how files and folders are
    // deleted.  Given a path and a pattern, attempts to delete all
    // files/folders matching the pattern in path.  By default, files
    // and folders matching pattern are deleted, however, the
    // `options' object can be used to configure whether files or
    // folders are deleted.  Add truthy/falsy keys 'files' or
    // 'folders' to enable/disable file/folder deletion.
    //
    // If 'folders' is set to true, will recursively delete the entire
    // contents of any matching folders found in `path'.
    //
    DeleteInFolderMatching (path, pattern, options) {
        const ipath = this._ConvertExternalToInternalPath(path);

        const defaults = {
            files:   true,
            folders: true
        };

        options = options || {};
        options = Object.assign({}, defaults, options);

        const files   = this.FindFiles(path, pattern),
              folders = this.FindFolders(path, pattern);

        let num_deleted = 0;

        if (options.files && files) {
            for (let i = 0; i < files.length; i++) {
                this.vfs.unlinkSync(`${ipath}/${files[i]}`);
                num_deleted++;
            }
        }

        if (options.folders && folders) {
            for (let i = 0; i < folders.length; i++) {
                this.Delete(`${ipath}/${folders[i]}`);
                num_deleted++;
            }
        }

        return num_deleted;
    }

    // Rename
    // ======
    //
    // Renames a given `source' to `destination'.
    //
    Rename (source, destination, options) {

        const isource      = this._ConvertExternalToInternalPath(source),
              idestination = this._ConvertExternalToInternalPath(destination);

        this.vfs.renameSync(isource, idestination);
    }

    // Move
    // ====
    //
    // Recursively moves files and folders from `source' to
    // `destination'.
    //
    Move (source, destination, overwrite) {

        if (overwrite === undefined || overwrite === null) overwrite = false;

        const isource      = this._ConvertExternalToInternalPath(source),
              idestination = this._ConvertExternalToInternalPath(destination);

        if (this.FileExists(isource)) {

            this.vfs.copyFileSync(isource, idestination);
            this.vfs.unlinkSync(isource);

            return;
        }

        let walk = (source, dest) => {

            let folders = this.FindAllFolders(source),
                files   = this.FindAllFiles(source);

            if (folders.length) {
                for (let i = 0; i < folders.length; i++) {
                    this.AddFolder(`${dest}/${folders[i]}`);
                    walk(`${source}/${folders[i]}`, `${dest}/${folders[i]}`);
                }
            }

            for (let i = 0; i < files.length; i++) {

                const destfile = `${dest}/${files[i]}`,
                      srcfile  = `${source}/${files[i]}`;

                if (overwrite === false && this.FileExists(destfile)) {
                    throw new Error("Cannot move: destination file already exists");
                }

                this.vfs.copyFileSync(srcfile, destfile);
                this.vfs.unlinkSync(srcfile);
            }
        };

        walk(isource, idestination);
    }

    // CopyFolder
    // ==========
    //
    // Copies a `source' folder to a `destination'.  All internal
    // files and folders are also copied.  If the source folder ends
    // with a trailing path separator, it indicates that the folder's
    // contents should be copied, rather than the top-level folder.
    //
    CopyFolder (source, destination, overwrite) {

        if (overwrite === undefined || overwrite === null) overwrite = true;

        let isource      = this._ConvertExternalToInternalPath(source),
            idestination = this._ConvertExternalToInternalPath(destination);

        if (isource === idestination) throw new Error("source and destination are equal");

        if (source.endsWith("\\") === false) {
            const isource_basename = win32path.basename(isource);
            this.vfs.mkdirpSync(`${idestination}/${isource_basename}`);
            idestination = `${idestination}/${isource_basename}`;
        }

        const vfs  = this.vfs,
              self = this;

        recursive_copy(isource, idestination);

        function recursive_copy (src, dst) {

            vfs.readdirSync(src).forEach(item => {

                let srcpath = `${src}/${item}`,
                    dstpath = `${dst}/${item}`;

                // Does the file exist in the destination already?
                if (vfs.statSync(srcpath).isDirectory()) {
                    vfs.mkdirpSync(dstpath);
                    recursive_copy(srcpath, dstpath);
                }
                else if (vfs.existsSync(dstpath) && overwrite === false) {
                    throw new Error("Cannot copy - destination file already exists");
                }
                else {
                    vfs.copyFileSync(srcpath, dstpath);
                }
            });
        }
    }

    // FolderListContents
    // ==================
    //
    // Given an absolute path to a directory, returns an array
    // containing all of the files located within the folder.
    //
    FolderListContents (folderpath) {

        let ipath    = this._ConvertExternalToInternalPath(folderpath),
            contents = this.vfs.readdirSync(ipath);

        return contents;
    }

    // AddFolder
    // =========
    //
    // Creates a new directory tree.  If the path does not exist, and
    // auto-vivification is enabled, `AddFolder' will create the
    // entire folder path.
    //
    AddFolder (win_path, options) {

        if (!this.FolderExists(win_path)) {
            let ipath = this._ConvertExternalToInternalPath(win_path);
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

        let ipath = this._ConvertExternalToInternalPath(filepath);

        try {
            return this.vfs.readSync(ipath);
        }
        catch (e) {
            return false;
        }
    }

    // IsFolder
    // ========
    //
    // If the path resolves to a folder, returns TRUE, else returns
    // FALSE.
    //
    IsFolder (filepath) {

        let ipath = this._ConvertExternalToInternalPath(filepath);

        try {
            return this.vfs.lstatSync(ipath).isDirectory();
        }
        catch (e) {
            return false;
        }
    }

    // IsFile
    // ======
    //
    // If the path resolves to a file, returns TRUE, else returns
    // FALSE.
    //
    IsFile (filepath) {

        let ipath = this._ConvertExternalToInternalPath(filepath);

        try {
            return this.vfs.lstatSync(ipath).isFile();
        }
        catch (e) {
            return false;
        }
    }

    // GetShortName
    // ============
    //
    // Returns the shortname of the last item in `filepath'.
    //
    GetShortName (filepath) {

        let ipath = this._ConvertExternalToInternalPath(filepath);

        const basename = win32path.basename(ipath),
              dirname  = win32path.dirname(ipath),
              symlinks = this.vfs.readdirSymlinks(dirname);

        for (let i = 0; i < symlinks.length; i++) {

            let link_ptr = this.vfs.readlinkSync(`${dirname}/${symlinks[i]}`);

            if (link_ptr.toLowerCase() === ipath.toLowerCase()) {
                return symlinks[i].toUpperCase();
            }
        }

        return basename;
    }
}

module.exports = VirtualFileSystem;
