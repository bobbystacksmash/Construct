const Component    = require("../Component");
const proxify      = require("../proxify2");
const win32path    = require("path").win32;

class JS_FoldersCollection extends Component {

    constructor(context, path) {

	super(context, "FoldersCollection");
	this.context = context;

        this.ee  = this.context.emitter;
        this.vfs = this.context.vfs;

        this._path = path;

        this._assert_exists = () => {

            if (this.vfs.FolderExists(this._path)) return;

            this.context.exceptions.throw_path_not_found(
                "FoldersCollection",
                "The backing folder is no longer available.",
                "The folder which backed this object instance is " +
                    "no longer present on the filesystem (it may " +
                    "have been deleted)."
            );
        };

        this._assert_exists();
    }

    get count () {
        const folders = this.vfs.FindAllFolders(this._path);
        return folders.length;
    }

    item (name) {

        this.ee.emit("FoldersCollection.Item");

        if (typeof name !== "string") {
            this.context.exceptions.throw_invalid_fn_arg(
                "FoldersCollection",
                "Argument passed to FoldersCollection.Item that is not a string.",
                "The FoldersCollection.Item method will only return files by their " +
                    "string name (not the ordinal position).  Ensure that only " +
                    "strings are passed to .Item."
            );
        }

        this._assert_exists();

        const folders = this.vfs.Find(this._path, "*", {
            files: false,
            folders: true,
            links: true
        });

        const folder_index = folders.indexOf(name.toLowerCase());

        if (folder_index === -1) {
            this.context.exceptions.throw_path_not_found(
                "FoldersCollection",
                "Folder not found.",
                `Unable to find the folder ${name}.`
            );
        }

        const FolderObject = require("./FolderObject");
        return new FolderObject(this.context, `${this._path}//${name}`);
    }

    add (new_folder_name) {

        this._assert_exists();

        if (typeof new_folder_name !== "string" || new_folder_name === "") {
            this.context.exceptions.throw_invalid_fn_arg(
                "FoldersCollection",
                "Argument to FoldersCollection.Add that is not a valid string.",
                "FoldersCollection.Add must be a string."
            );
        }

        if (/^\.?[\\/]/.test(new_folder_name)) {
            this.context.exceptions.throw_invalid_fn_arg(
                "FoldersCollection",
                "Folder to add must be only the folder name.",
                "Cannot add a new folder which contains any invalid " +
                    "or extra path parts (such as '..' or '\'.)"
            );
        }

        if (this.vfs.PathIsRelative(new_folder_name)) {
            if (/^c:/i.test(new_folder_name)) {
                this.context.exceptions.throw_path_not_found(
                    "FoldersCollection",
                    "Path not found.",
                    "Cannot use relative paths which begin 'C:'."
                );
            }
        }

        const dirname  = win32path.dirname(new_folder_name).toLowerCase(),
              basename = win32path.basename(new_folder_name).toLowerCase();

        if (dirname === ".") {

            if (basename === "" || basename === ".." || basename === ".") {
                this.context.exceptions.throw_invalid_fn_arg(
                    "FoldersCollection",
                    "Folder to add must be a valid folder name (not '.' or '..')",
                    "The folder name must be a valid folder name.  Note that " +
                        "folder names such as '.' or '../../' do not resolve " +
                        "to valid folder names, and therefore cannot be used."
                );
            }

            if (basename === new_folder_name.toLowerCase()) {

                const abspath_to_new_folder = win32path.join(
                    this._path, new_folder_name
                );

                if (this.vfs.FolderExists(abspath_to_new_folder)) {
                    this.context.exceptions.throw_file_already_exists(
                        "FoldersCollection",
                        "Failed while trying to add existing folder.",
                        "A file or folder exists in the destination which " +
                            "matches the new foldername."
                    );
                }

                this.vfs.AddFolder(abspath_to_new_folder);
            }
        }
    }
}

module.exports = function create(context, path) {
    let folders_collection = new JS_FoldersCollection(context, path);
    return proxify(context, folders_collection);
};
