const Component    = require("../Component");
const proxify      = require("../proxify2");
const FolderObject = require("./FolderObject");

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

        const folders = this.vfs.Find(this._path, "*", { files: false, folders: true, links: true }),
              folder_index = folders.indexOf(name.toLowerCase());

        if (folder_index === -1) {
            this.context.exceptions.throw_path_not_found(
                "FoldersCollection",
                "Folder not found.",
                `Unable to find the folder ${name}.`
            );
        }

        return new FolderObject(this.context, `${this._path}//${name}`);
    }
}

module.exports = function create(context, path) {
    let folders_collection = new JS_FoldersCollection(context, path);
    return proxify(context, folders_collection);
};
