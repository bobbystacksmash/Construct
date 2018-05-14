const assert = require("chai").assert;
const FSO = require("../../src/winapi/FileSystemObject");
const VirtualFileSystem = require("../../src/runtime/virtfs");

let context = {
    epoch: 1,
    ENVIRONMENT: { Arguments: { "foo": "bar" } },
    emitter: { emit: () => {} },
    exceptions: {},
    vfs: {}
};

var ctx = null;

beforeEach(() => {
    let vfs = new VirtualFileSystem({ register: () => {} });
    ctx = Object.assign({}, context, { vfs: vfs });
});

describe("Scripting.FileSystemObject", () => {

    describe("Properties", () => {
    });

    describe("Methods", () => {

        describe("#BuildPath", () => {

            it("should build a path from two parts", (done) => {
                assert.equal((new FSO(ctx)).BuildPath("foo", "bar"), "foo\\bar");

                assert.equal((new FSO(ctx)).BuildPath("\\\\foo\\bar", "testing\\test.txt"),
                             "\\\\foo\\bar\\testing\\test.txt");
                done();
            });

            it("should just combine the two parts, not check if they're valid", (done) => {
                let fso = new FSO(ctx);
                assert.equal(fso.BuildPath("C:\\foo\\bar", "../../../baz"),
                             "C:\\foo\\bar\\../../../baz");
                done();
            });
        });

        describe("#CopyFile", () => {
            // TODO - blocked on wildcards
        });

        describe("#CopyFolder", () => {
            // TODO - blocked on wildcards
        });

        describe("#CreateFolder", () => {

            it("should successfully create/return a folder", (done) => {

                let fso = new FSO(ctx);
                assert.isFalse(fso.FolderExists("C:\\foo\\bar"));

                let dir = fso.CreateFolder("C:\\foo\\bar");
                assert.equal(dir.constructor.name, "FolderObject");

                done();
            });

            it("should throw if the folder already exists", (done) => {

                ctx = Object.assign({}, ctx, {
                    exceptions: {
                        throw_file_already_exists: () => {
                            throw new Error("dir exists");
                        }
                    }});

                let fso = new FSO(ctx);
                fso.CreateFolder("C:\\foo\\bar");

                assert.throws(() => fso.CreateFolder("C:\\foo\\bar"), "dir exists");
                done();
            });

            it("should throw 'path not found' if volume does not exist", (done) => {

                ctx = Object.assign({}, ctx, {
                    exceptions: {
                        throw_path_not_found: () => {
                            throw new Error("drive not found");
                        }
                    }});

                let fso = new FSO(ctx);
                assert.throws(() => fso.CreateFolder("F:\\foo\\bar"), "drive not found");
                done();
            });

            // TODO:
            //
            //  - what if the path is invalid?
            it("should throw if the path is invalid", (done) => {

                ctx = Object.assign({}, ctx, {
                    exceptions: {
                        throw_bad_filename_or_number: () => {
                            throw new Error("bad pathname");
                        }
                    }});

                let fso = new FSO(ctx);
                assert.throws(() => fso.CreateFolder("C:\\<*.."), "bad pathname");
                done();
            });
        });

        const NOOP = () => {};

        describe("#CreateTextFile", () => {

            // TODO:
            //
            //  - throw if wildcard chars are used in filename
            //  - should create a file in CWD if no path specified
            //  - if script has full path but that path does not exist, should throw
            //    - may be an opportunity to test auto-vivify FS feature?
            //  - the default overwrite value is false
            //  - Unicode is the default encoding scheme, else use ASCII.
        });

        describe("#DeleteFile", NOOP);
        describe("#DeleteFolder", NOOP);
        describe("#DriveExists", NOOP);

        describe("#FileExists", NOOP);
        describe("#FolderExists", NOOP);
        describe("#GetAbsolutePathName", NOOP);
        describe("#GetBaseName", NOOP);
        describe("#GetDrive", NOOP);
        describe("#GetDriveName", NOOP);
        describe("#GetExtensionName", NOOP);
        describe("#GetFile", NOOP);

        describe("#GetFileName", NOOP);
        describe("#GetFolder", NOOP);
        describe("#GetParentFolderName", NOOP);
        describe("#GetSpecialFolders", NOOP);
        describe("#GetTempName", NOOP);
        describe("#MoveFile", NOOP);
        describe("#MoveFolder", NOOP);
        describe("#OpenTextfile", NOOP);
    });
});
