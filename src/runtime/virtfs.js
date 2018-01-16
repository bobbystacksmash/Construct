
const path   = require("path");
const Folder = require("../winapi/FolderObject");


function VirtualFileSystem(ctx) {

    ctx = ctx || {};

    // TODO: We need the epoch to propegate through to here so we
    //       create file MACE times that match the runtime environment.
    //
    //
    this.epoch   = ctx.epoch   || ctx.date.getTime();
    this.emitter = ctx.emitter,
    this.mft   = { "C:": {} };

    return this;
}


VirtualFileSystem.prototype.create = function (new_file_or_folder_path, type, file_contents) {

    if (type !== "folder" && type !== "file") {
        throw {
            name     : "VFS: Unknown file/folder type",
            message  : `Unknown file or folder type: ${type}.`,
            toString : () => `${this.name}: ${this.message}`
        };
    }

    let path_parts = path.parse(new_file_or_folder_path),
        path_list  = path_parts.name.split("\\"),
        filename   = path.basename(path_parts.base),
        $MFT       = this.mft,
        parent     = $MFT["C:"];

    path_list.forEach((path_part, i, arr) => {

        let last_element = i === (arr.length - 1);

        if (last_element && type === "file") {
            path_part = `${path_part}$`;
        }

        let mtime =
            atime =
            ctime =
            etime = new Date(this.epoch).getTime();

        let table_entry = {
            mtime    : mtime,
            atime    : atime,
            ctime    : ctime,
            etime    : etime,
            type     : last_element ? type : "folder",
            contents : file_contents || null,
            children : {}
        };

        if (!$MFT.hasOwnProperty(path_part)) {
            parent[path_part] = table_entry;
            parent = table_entry.children;
        }
    });
}

module.exports = VirtualFileSystem;
