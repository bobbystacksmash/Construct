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

    function find_existing_file_or_folder_index (new_file) {
        return this_dir.findIndex((x) => {
            return x.label === new_file.label && x.type === new_file.type;
        });
    };

    function update_mft (file_or_folder_part, i, arr) {

        let last_element = (i === (arr.length - 1));

        let new_file_or_folder = {
            label    : file_or_folder_part,
            type     : last_element ? type : "folder",
            children : []
        };

        let existing_index = find_existing_file_or_folder_index(new_file_or_folder);

        if (existing_index > -1) {
            this_dir = this_dir[existing_index].children
        }
        else {
            this_dir.unshift(new_file_or_folder);
            this_dir = this_dir[0].children
        }

    }

    path_parts.forEach(update_mft);
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
