/*
 * ========================
 * File System Object (FSO)
 * ========================
 */
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

module.exports = FileSystemObjectProxy;
