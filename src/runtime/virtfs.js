function VirtualFileSystem(opts) {

    opts = opts || {};

    // TODO: We need the epoch to propegate through to here so we
    //       create file MACE times that match the runtime environment.
    //
    this.epoch = opts.epoch || new Date().getTime();
    this.mft   = {};
}


VirtualFileSystem.prototype.create = function (path_to_file, file_contents) {

    let file_entry = {
        create_time   : new Date(this.epoch).getTime(),
        file_contents : file_contents
    };

    this.mft[path_to_file] = file_entry;
}

module.exports = VirtualFileSystem;
