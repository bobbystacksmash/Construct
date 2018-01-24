const path       = require("path");
const Folder     = require("../winapi/FolderObject");

function VirtualFileSystem(ctx) {

    ctx = ctx || {};

    // TODO: We need the epoch to propegate through to here so we
    //       create file MACE times that match the runtime environment.
    //
    //

    this.epoch   = ctx.epoch   || ctx.date.getTime();
    this.emitter = ctx.emitter,
    this.volumes = { "c:": { mft: [], usn: {} } };

    this.mft   = { "c:": {} };

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

    new_file_or_folder_path = new_file_or_folder_path.toLowerCase();

    let path_parts   = new_file_or_folder_path.replace("/", "\\").split("\\"),
        filename     = path.basename(new_file_or_folder_path),
        volume_label = path_parts.shift(),
        $MFT         = this.volumes[volume_label].mft,
        this_dir     = $MFT;

    var exists = (nf) => this_dir.filter((d) => { d.label === nf.label && d.type === nf.type });

    path_parts.forEach((path_part, i, arr) => {

        console.log("MFT:");
        console.log(JSON.stringify($MFT));
        console.log("this_dir");
        console.log(JSON.stringify(this_dir));
        console.log("----");

        console.log("")
        console.log("Path part: ", path_part);

        let last_element = (i === (arr.length - 1));

        let new_file_or_folder = {
            label    : path_part,
            type     : last_element ? type : "folder",
            children : []
        };

        // Does the label of the current path match any of the children?
        this_dir.unshift(new_file_or_folder);
        console.log("exists>>>");
        console.log(exists(new_file_or_folder));

        this_dir = this_dir[0].children

        console.log("#### END OF LOOP ####\n");

        /*if (!$MFT.hasOwnProperty(path_part)) {

            parent[path_part] = table_entry;
            parent = table_entry.children;
        }*/
    });

    ["users"].forEachkkkkkk

    console.log("FINAL MFT:");
    console.log(JSON.stringify($MFT, null, 1));
}

VirtualFileSystem.prototype.folder_exists = function (folderpath) {

    console.log(folderpath);

    let folderpath_parts = folderpath.split("\\");
    
    // FIXME: Windows is case-insensitive.
    function find_folderpath (folderpath, mft) {
        console.log(folderpath);
    }

    return find_folderpath(folderpath_parts, this.mft);
}


VirtualFileSystem.prototype.file_exists = function (filepath) {
    let filepath_parts = filepath.split("\\");
}

module.exports = VirtualFileSystem;
