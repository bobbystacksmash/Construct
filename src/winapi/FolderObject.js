/*
 * "Provides access to all the properties of a folder."
 *  - https://msdn.microsoft.com/en-us/library/1c87day3(v=vs.84).aspx
 *
 */

const Component     = require("../Component");
const proxify       = require("../proxify2");

class JS_FolderObject extends Component {

    constructor(context, path) {

	super(context, "Folder");

	this.context = context;
        this.ee      = this.context.emitter;
        this.vfs     = this.context.vfs;
        this._path   = path;

        this._assert_exists = () => {
            if (this.vfs.FolderExists(this._path)) return;

            this.context.exceptions.throw_path_not_found(
                "foo", "bar", "baz" // fixme
            );
        }

    }

    get attributes () {}
    get datecreated () {}
    get datelastaccessed () {}
    get datelastmodified () {}
    get drive () {}
    get files () {}
    get isrootfolder () {}

    // Name
    // ====
    //
    // Returns the folder name.
    //
    get name () {
        this._assert_exists();
    }

    get parentfolder () {}
    get path () {}
    get shortname () {}
    get shortpath () {}
    get size () {}

    // SubFolders
    // ==========
    //
    // Returns a FoldersCollection instance which contains a realtime
    // view of the VFS.  Files which are deleted are no longer
    // accessible from the SubFolders instance.
    //
    get subfolders () {

    }


    get type () {}

    // Methods
    copy () {}
    createtextfile () {}

    // Delete
    // ======
    //
    // Deletes this folder from disk.
    //
    delete () {
        this.vfs.Delete(this._path);
    }
    move () {}
}

module.exports = function create(context, path) {
    let folder = new JS_FolderObject(context, path);
    return proxify(context, folder);
};
