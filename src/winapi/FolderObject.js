/* 
 * "Provides access to all the properties of a folder."
 *  - https://msdn.microsoft.com/en-us/library/1c87day3(v=vs.84).aspx
 *
 * METHODS
 * ~~~~~~~
 *  - Copy https://msdn.microsoft.com/en-us/library/6973t06a(v=vs.84).aspx
 *  - Delete
 *  - Move
 *  - CreateTextFile
 *
 * PROPERTIES
 * ~~~~~~~~~~
 *  - Attributes https://msdn.microsoft.com/en-us/library/5tx15443(v=vs.84).aspx
 *  - DateCreated https://msdn.microsoft.com/en-us/library/ke6a7czx(v=vs.84).aspx
 *  - DateLastAccessed https://msdn.microsoft.com/en-us/library/6zc3f20t(v=vs.84).aspx
 *  - DateLastModified https://msdn.microsoft.com/en-us/library/c8xh895w(v=vs.84).aspx
 *  - Drive https://msdn.microsoft.com/en-us/library/2hawed3c(v=vs.84).aspx
 *  - Files https://msdn.microsoft.com/en-us/library/18b41306(v=vs.84).aspx
 *  - IsRootFolder https://msdn.microsoft.com/en-us/library/w5kzk8s5(v=vs.84).aspx
 *  - Name https://msdn.microsoft.com/en-us/library/zawxett8(v=vs.84).aspx
 *  - ParentFolder https://msdn.microsoft.com/en-us/library/dt64ftxb(v=vs.84).aspx
 *  - Path https://msdn.microsoft.com/en-us/library/x9kfyt6a(v=vs.84).aspx
 *  - ShortName https://msdn.microsoft.com/en-us/library/htyh9b2z(v=vs.84).aspx
 *  - ShortPath https://msdn.microsoft.com/en-us/library/tes8ehwe(v=vs.84).aspx
 *  - Size https://msdn.microsoft.com/en-us/library/2d66skaf(v=vs.84).aspx
 *  - SubFolders https://msdn.microsoft.com/en-us/library/e1dthkks(v=vs.84).aspx
 *  - Type https://msdn.microsoft.com/en-us/library/y7k0wsxy(v=vs.84).aspx
 *
 */
const proxify2 = require("../proxify2"),
    events     = require("../events");

function FolderObject (ctx) {

    let ee  = ctx.emitter,
        dt  = ctx.date,
        mft = ctx.vfs;

    // https://msdn.microsoft.com/en-us/library/6973t06a(v=vs.84).aspx
    function Copy (destination_path, overwrite) {
    

    }


    function Delete () {}
    function Move () {}
    function CreateTextFile () {}

    var FolderObject = {
        Copy           : Copy,
        Delete         : Delete,
        Move           : Move,
        CreateTextFile : CreateTextFile
    };

    return proxify2(FolderObject, "FolderObject", ctx);

}

module.exports = FolderObject;
