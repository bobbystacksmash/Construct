const proxify2 = require("../proxify2");

/*
 * https://msdn.microsoft.com/en-us/library/hww8txat(v=vs.84).aspx
 *
 * METHODS
 * =======
 *
 * [ ] GetFolder   - https://msdn.microsoft.com/en-us/library/f1xtf7ta(v=vs.84).aspx       
 *
 *
 * PROPERTIES
 * ==========
 *
 */

var CTX;

/*
 * Returns a Folder object corresponding to the folder in `folder_spec'.
 */
function GetFolder(folder_spec) {

}


function FolderExists(path) {
    // TODO: Need to update this to use VFS.
    // TODO: Maybe this should be toggle-able?
    // IDEA: Maybe we could include this check as part of the "fuzzer"?
    return isNaN(path);
}

module.exports = function FileSystemObject (ctx) {

    CTX = ctx;

    let ee = ctx.emitter;

    let FileSystemObject = {
        GetFolder: GetFolder
    };

    return proxify2(FileSystemObject, "FileSystemObject", ctx);
};
