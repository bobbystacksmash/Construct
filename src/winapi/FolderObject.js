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

        this.ee  = this.context.emitter;
        this.vfs = this.context.vfs;
    }

    get attributes () {}
    get datecreated () {}
    get datelastaccessed () {}
    get datelastmodified () {}
    get drive () {}
    get files () {}
    get isrootfolder () {}
    get name () {}
    get parentfolder () {}
    get path () {}
    get shortname () {}
    get shortpath () {}
    get size () {}
    get subfolders () {}
    get type () {}

    // Methods
    copy () {}
    createtextfile () {}
    delete () {}
    move () {}
}

module.exports = function create(context, path) {
    let folder = new JS_FolderObject(context, path);
    return proxify(context, folder);
};
