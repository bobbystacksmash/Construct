const assert = require("chai").assert;
const FSO = require("../../src/winapi/FileSystemObject");
const VirtualFileSystem = require("../../src/runtime/virtfs");

var ctx = null;

function MakeFSO (opts) {

    opts = opts || {};

    opts.exceptions  = opts.exceptions  || {};
    opts.environment = opts.environment || {};
    opts.config      = opts.config      || {};

    var default_env = {
        Path: "C:\\Users\\Construct"
    };

    var default_cfg = {
        "autovivify": true
    };


    let env = Object.assign({}, default_env, opts.ENVIRONMENT),
        cfg = Object.assign({}, default_cfg, opts.config);

    let context = {
        epoch: 1,
        ENVIRONMENT: env,
        CONFIG: cfg,
        emitter: { emit: () => {} },
        exceptions: {},
        vfs: {},
        get_env: (e) => env[e],
        get_cfg: (c) => cfg[c]
    };

    let new_ctx = Object.assign({}, context, opts);

    let vfs = new VirtualFileSystem(new_ctx);
    new_ctx.vfs = vfs;

    // We set this just so code outside of this function can access
    // the created context object should it need to.
    ctx = new_ctx;

    return new FSO(new_ctx);
}

describe("Scripting.FileSystemObject", () => {

    describe("Properties", () => {
    });

    describe("Methods", () => {

        xdescribe("#BuildPath", () => {

            it("should build a path from two parts", (done) => {

                let fso = MakeFSO();

                assert.equal(fso.BuildPath("foo", "bar"), "foo\\bar");
                assert.equal(fso.BuildPath("\\\\foo\\bar", "testing\\test.txt"),
                             "\\\\foo\\bar\\testing\\test.txt");
                done();
            });

            it("should just combine the two parts, not check if they're valid", (done) => {

                let fso = MakeFSO();

                assert.equal(fso.BuildPath("C:\\foo\\bar", "../../../baz"),
                             "C:\\foo\\bar\\../../../baz");
                done();
            });
        });

        xdescribe("#CopyFile", () => {
            // TODO - blocked on wildcards
        });

        xdescribe("#CopyFolder", () => {
            // TODO - blocked on wildcards
        });

        xdescribe("#CreateFolder", () => {

            it("should successfully create/return a folder", (done) => {

                let fso = MakeFSO();
                assert.isFalse(fso.FolderExists("C:\\foo\\bar"));

                let dir = fso.CreateFolder("C:\\foo\\bar");
                assert.equal(dir.constructor.name, "FolderObject");

                done();
            });

            it("should throw if the folder already exists", (done) => {

                let fso = MakeFSO({
                    exceptions: {
                        throw_file_already_exists: () => {
                            throw new Error("dir exists");
                        }
                    }
                });

                fso.CreateFolder("C:\\foo\\bar");

                assert.throws(() => fso.CreateFolder("C:\\foo\\bar"), "dir exists");
                done();
            });

            it("should throw 'path not found' if volume does not exist", (done) => {

                let fso = MakeFSO({
                    exceptions: {
                        throw_path_not_found: () => {
                            throw new Error("drive not found");
                        }
                    }
                });

                assert.throws(() => fso.CreateFolder("F:\\foo\\bar"), "drive not found");
                done();
            });

            // TODO:
            //
            //  - what if the path is invalid?
            it("should throw if the path is invalid", (done) => {

                let fso = MakeFSO({
                    exceptions: {
                        throw_bad_filename_or_number: () => {
                            throw new Error("bad pathname");
                        }
                    }
                });

                assert.throws(() => fso.CreateFolder("C:\\<*.."), "bad pathname");
                done();
            });
        });

        const NOOP = () => {};

        describe("#CreateTextFile", () => {

            it("should throw 'bad filename or number' if a wildcard appears in the filename", (done) => {

                let fso = MakeFSO({
                    exceptions: {
                        throw_bad_filename_or_number: () => {
                            throw new Error("wildcards not permitted");
                        }
                    }});

                assert.throws(() => fso.CreateTextFile("foo*.txt"),       "wildcards not permitted");
                assert.throws(() => fso.CreateTextFile("C:\\foo>.txt"),   "wildcards not permitted");
                assert.throws(() => fso.CreateTextFile("C:\\*\\foo.txt"), "wildcards not permitted");

                done();
            });

            it("should throw if overwriting is is disabled", (done) => {

                let fso = MakeFSO({
                    exceptions: {
                        throw_file_already_exists: () => {
                            throw new Error("file exists...");
                        }
                    }
                });

                ctx.vfs.AddFile("C:\\file.txt", "abcd");

                const OVERWRITE = false;
                assert.throws(() => fso.CreateTextFile("C:\\file.txt", OVERWRITE), "file exists...");

                done();
            });

            it("should create the text file in the CWD if no path is given", (done) => {

                let fso = MakeFSO();

                assert.isFalse(ctx.vfs.GetFile("C:\\Users\\Construct\\file.txt"));
                fso.CreateTextFile("file.txt");
                assert.equal(ctx.vfs.GetFile("C:\\Users\\Construct\\file.txt").constructor.name, "FileObject");

                done();
            });

            it("should create a file even if the path is partial", (done) => {

                let fso = new FSO(ctx);

                assert.isFalse(ctx.vfs.GetFile("C:\\relative.txt"));
                fso.CreateTextFile("../../relative.txt");
                assert.equal(ctx.vfs.GetFile("C:\\relative.txt").constructor.name, "FileObject");

                done();
            });

            it("should throw if the filepath does not exist", (done) => {

                let fso = MakeFSO({
                    exceptions: {
                        throw_bad_filename_or_number: () => { throw new Error("autoviv blocked create") }
                    },
                    config: { autovivify: false } });

                assert.throws(() => fso.CreateTextFile("C:\\bogus\\path.txt"), "autoviv blocked create");

                done();
            });

            xit("TODO should throw if trying to overwrite an existing file", (done) => {

                let fso = MakeFSO({
                    exceptions: {
                        throw_bad_filename_or_number: () => {
                            throw new Error("File exists - overwrite is false")
                        }
                    }
                });

                done();

            });


            // TODO:
            //
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
