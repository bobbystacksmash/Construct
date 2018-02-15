const AbsFileSystemObject = require("../absFileSystemObject");

class FileObject extends AbsFileSystemObject {

    //
    // FileObject instances are ALWAYS leaf nodes.
    //
    constructor(context, path, args) {
	console.log(`New FileObject(${path})`);
	super(context, path, "File", args);
    }

    get contents () {
	return this.__contents;
    }
}
