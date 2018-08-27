const assert            = require("chai").assert;
const FilesCollection   = require("../../src/winapi/FilesCollection");
const VirtualFileSystem = require("../../src/runtime/virtfs");
const make_ctx = require("../testlib");


describe("FilesCollection", () => {

    describe("Count", () => {

        it("should return the correct count for files in the collection", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFile("C:\\RootOne\\a.txt");
            ctx.vfs.AddFile("C:\\RootOne\\b.txt");
            ctx.vfs.AddFile("C:\\RootOne\\c.txt");

            const fc = new FilesCollection(ctx, "C:\\RootOne");
            assert.isNumber(fc.count);
            assert.equal(fc.count, 3);
        });

        it("should return zero if there are no files in the collection", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFolder("C:\\RootOne");

            const fc = new FilesCollection(ctx, "C:\\RootOne");
            assert.equal(fc.count, 0);
        });

        it("should update count if new files are added after instantiation", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFolder("C:\\RootOne");
            ctx.vfs.AddFile("C:\\RootOne\\a.txt");
            ctx.vfs.AddFile("C:\\RootOne\\b.txt");
            ctx.vfs.AddFile("C:\\RootOne\\c.txt");

            const fc = new FilesCollection(ctx, "C:\\RootOne");
            assert.equal(fc.count, 3);

            ctx.vfs.AddFile("C:\\RootOne\\d.txt");
            assert.equal(fc.count, 4);
        });

        it("should update count if files are deleted after instantiation", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFolder("C:\\RootOne");
            ctx.vfs.AddFile("C:\\RootOne\\a.txt");
            ctx.vfs.AddFile("C:\\RootOne\\b.txt");
            ctx.vfs.AddFile("C:\\RootOne\\c.txt");

            const fc = new FilesCollection(ctx, "C:\\RootOne");
            assert.equal(fc.count, 3);

            ctx.vfs.Delete("C:\\RootOne\\c.txt");
            assert.equal(fc.count, 2);
        });

        it("should not update the count if a new FOLDER is added to the dir", () => {

            const ctx = make_ctx();

            ctx.vfs.AddFolder("C:\\RootOne");
            ctx.vfs.AddFile("C:\\RootOne\\a.txt");
            ctx.vfs.AddFile("C:\\RootOne\\b.txt");
            ctx.vfs.AddFile("C:\\RootOne\\c.txt");

            const fc = new FilesCollection(ctx, "C:\\RootOne");
            assert.equal(fc.count, 3);

            ctx.vfs.AddFolder("C:\\RootOne\\foo");
            assert.equal(fc.count, 3);
        });

        it("should throw a 'path not found' exception if the backing folder is deleted", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_path_not_found: () => {
                        throw new Error("backing folder is gone");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\a.txt");
            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\b.txt");

            const fc = new FilesCollection(ctx, "C:\\RootOne\\SubFolder1");
            assert.equal(fc.count, 2);

            ctx.vfs.Delete("C:\\RootOne\\SubFolder1");
            assert.throws(() => fc.count, "backing folder is gone");
        });
    });

    describe("Item", () => {

        it("should fetch the item by name", () => {
            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\RootOne\\a.txt");
            const fc = new FilesCollection(ctx, "C:\\RootOne");
            assert.equal(fc.Item("a.txt").name, "a.txt");
        });

        it("should fetch the item by SFN", () => {
            const ctx = make_ctx();
            ctx.vfs.AddFile("C:\\HelloWorld\\LongFilename.txt");
            const fc = new FilesCollection(ctx, "C:\\HELLOW~1");
            assert.equal(fc.Item("LONGFI~1.TXT").name, "LONGFI~1.TXT");
        });

        it("should throw a 'file not found' exception if the file doesn't exist", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_file_not_found: () => {
                        throw new Error("file not found");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\a.txt");
            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\b.txt");

            const fc = new FilesCollection(ctx, "C:\\RootOne\\SubFolder1");
            assert.doesNotThrow(() => fc.Item("b.txt"));
            assert.throws(() => fc.Item("c.txt"), "file not found");
        });

        it("should throw an 'invalid procedure call' exception if .Item arg is not string", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("not a string");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\a.txt");

            const fc = new FilesCollection(ctx, "C:\\RootOne\\SubFolder1");

            assert.equal(fc.count, 1);

            assert.throws(() => fc.Item(2),          "not a string");
            assert.throws(() => fc.Item(null),       "not a string");
            assert.throws(() => fc.Item(undefined),  "not a string");
            assert.throws(() => fc.Item([]),         "not a string");
            assert.throws(() => fc.Item({}),         "not a string");
            assert.throws(() => fc.Item(() => true), "not a string");
        });

        it("should throw a 'path not found' exception if the backing folder is deleted", () => {

            const ctx = make_ctx({
                exceptions: {
                    throw_path_not_found: () => {
                        throw new Error("backing folder is gone");
                    }
                }
            });

            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\a.txt");
            ctx.vfs.AddFile("C:\\RootOne\\SubFolder1\\b.txt");

            const fc = new FilesCollection(ctx, "C:\\RootOne\\SubFolder1");
            assert.equal(fc.count, 2);

            ctx.vfs.Delete("C:\\RootOne\\SubFolder1");
            assert.throws(() => fc.Item("a.txt"), "backing folder is gone");
        });
    });
});

// TODO: Add a test to ensure the files.count drops when '.delete' is called on a file
// TODO: Add a test to ensure the files.item method fails when trying to find a moved file
