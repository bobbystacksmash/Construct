module.exports = function (opts) {

    var vfs     = {},
        emitter = opts.emitter || { emit: () => {} };

    function save (filepath, contents) {
        emitter.emit("fixme...", {});

        if (vfs.hasOwnProperty(filepath)) {
            emitter.emit("vfs.overwrite.event", {
                filepath: filepath,
                prev_contents: filepath[contents],
                now_contents:  contents
            });
        }


        vfs[filepath] = contents;
    }

    return {
        save: save
    };
};
