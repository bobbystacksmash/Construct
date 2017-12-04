/*
 * ========================
 * File System Object (FSO)
 * ========================
 */

const winevts           = require("../events");
const Proxify           = require("../proxify");

var ee;

var mock_fso = {

    // TODO: Add some sort of VFS here...

    FileExists: () => {
        console.info(`[FSO::FileExists] ${arguments}`);
        return false; // FIXME
    },

    DeleteFile: () => {
        console.info(`[FSO::DeleteFile] ${arguments}`);
        return true; // FIXME
    }
};

var FileSystemObjectProxy = new Proxy(mock_fso, {

    get (target, key, trap) {
        console.info(`[FSO] GET ${key}...`);
        return target[key];
    },

    set (target, key, value) {
        console.info(`SET on "${key}" with "${value}"`);
        return true;
    }
});


function create(opts) {

    ee = opts.emitter || { emit: () => {}, on: () => {} };

    let mock_FileSystemObject_API = {
    };

    let overrides = {
        get: (target, key) => {
            return mock_FileSystemObject_API[key]
        }
    };

    var proxify = new Proxify({ emitter: ee });
    return proxify(mock_FileSystemObject_API, overrides, "FileSystemObject");
}

module.exports = create;
