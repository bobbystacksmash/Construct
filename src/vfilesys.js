module.exports = function VFS (opts) {

    var vfs     = {},
        emitter = opts.emitter || { emit: () => {} };

    function save (filepath, contents) {

        emitter.emit("vfs.save", {
            path:     filepath,
            contents: contents
        });

        vfs[filepath] = contents;
    }

    return {
        save: save
    };
};
