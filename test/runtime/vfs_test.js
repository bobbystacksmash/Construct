const assert            = require('assert');
const JS_Date           = require("../../src/Date");
const VirtualFileSystem = require("../../src/runtime/virtfs");

var NOOP_emitter = { on: () => {}, emit: () => {} };

describe("VirtualFileSystem Module", function () { 

    describe("#create", function () {

        it("Paths should be split in to constituent vfs objects.", function () {

            let date   = new JS_Date({ epoch: 1234567890, emitter: NOOP_emitter })(),
                vfs    = new VirtualFileSystem({ date: date, emitter: NOOP_emitter }),
                volumn = vfs.volume,
                epoch  = date.getTime(),
                $MFT   = {
                    "C:": {
                        foo: {
                            type: "folder",
                            mtime: epoch,
                            atime: epoch,
                            ctime: epoch,
                            etime: epoch,
                            contents: null,
                            children: {
                                bar: {
                                    type: "folder",
                                    mtime: epoch,
                                    atime: epoch,
                                    ctime: epoch,
                                    etime: epoch,
                                    contents: null,
                                    children: {
                                        baz$: {
                                            type: "file",
                                            mtime: epoch,
                                            atime: epoch,
                                            ctime: epoch,
                                            etime: epoch,
                                            contents: null,
                                            children: {}
                                        }
                                    }
                                }
                            }
                        }
                    }
                };

            vfs.create("C:\\foo\\bar\\baz.txt", "file");
            assert.deepEqual(vfs.mft, $MFT);
        });
    });
});
