/*
 * "Provides access to all the properties of a folder."
 *  - https://msdn.microsoft.com/en-us/library/1c87day3(v=vs.84).aspx
 *
 */

const Component     = require("../Component");
const proxify       = require("../proxify2");

class JS_FoldersCollection extends Component {

    constructor(context, path) {

	super(context, "FoldersCollection");
	this.context = context;

        this.ee  = this.context.emitter;
        this.vfs = this.context.vfs;

        this._path = path;
    }

    get count () {
        const folders = this.vfs.FindAllFolders(this._path);
        return folders.length;
    }
}

module.exports = function create(context, path) {
    let folders_collection = new JS_FoldersCollection(context, path);
    return proxify(context, folders_collection);
};
