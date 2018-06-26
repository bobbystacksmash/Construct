const Component     = require("../Component");
const proxify       = require("../proxify2");
const FileObject    = require("./FileObject");

class JS_FilesCollection extends Component {

    constructor(context, path) {

	super(context, "FilesCollection");
	this.context = context;

        this.ee  = this.context.emitter;
        this.vfs = this.context.vfs;

        this._path = path;

        this._assert_exists = () => {

            if (this.vfs.FolderExists(this._path)) return;

            this.context.exceptions.throw_path_not_found(
                "FilesCollection",
                "The backing folder is no longer available.",
                "The folder which backed this object instance is " +
                    "no longer present on the filesystem (it may " +
                    "have been deleted)."
            );
        };
    }

    get count () {
        this.ee.emit("FilesCollection.Count");
        this._assert_exists();
        const files = this.vfs.FindAllFiles(this._path);
        return files.length;
    }

    item (name) {
        this.ee.emit("FilesCollection.Item");
        this._assert_exists();

        const files = this.vfs.Find(this._path, "*", { files: true, folders: false, links: true }),
              filename_index = files.indexOf(name.toLowerCase());

        if (filename_index === -1) {
            this.context.exceptions.throw_file_not_found(
                "FilesCollection",
                "File not found.",
                `Unable to find the file ${name} in this folder.  ` +
                    "Please try another filename."
            );
        }

        const found_item_name = files[filename_index];
        return new FileObject(this.context, `${this._path}//${name}`);
    }
}

module.exports = function create(context, path) {
    let files_collection = new JS_FilesCollection(context, path);
    return proxify(context, files_collection);
};
