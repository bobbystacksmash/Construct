const assert = require("chai").assert;
const BinaryStream = require("../../../src/winapi/support/BinaryStream");
const TextStream = require("../../../src/winapi/support/TextStream");
const VirtualFileSystem = require("../../../src/runtime/virtfs");

describe("BinaryStream", () => {

    describe(".charset", () => {

        it("should throw if '.charset' is assigned-to", (done) => {

            let bs = new BinaryStream();
            assert.throws(() => { bs.charset = "ascii"; });
            done();
        });
    });

    describe("#open", () => {

        it("should support specifiying a 'mode' property when opening the stream", (done) => {

            let bs = new BinaryStream();
            assert.equal(bs.mode, 0);

            assert.doesNotThrow(() => bs.open(1));
            assert.equal(bs.mode, 1);

            bs.close();

            assert.doesNotThrow(() => bs.open(2));
            assert.equal(bs.mode, 2);

            done();
        });


        it("should throw if an unopened stream is written to.", (done) => {
            let bs = new BinaryStream();
            assert.throws(function () { bs.load_from_file("C:\\foo\\bar.txt"); });
            done();
        });

        it("should throw if an opened stream has been closed and is written to.", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });
            let bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\foo\\bar.txt", "abcd");
            vfs.AddFile("C:\\baz.txt",      "efgh");

            bs.open();
            assert.doesNotThrow(function () { bs.load_from_file("C:\\foo\\bar.txt"); });
            bs.close();
            assert.throws(function () { bs.load_from_file("C:\\baz.txt"); });
            done();
        });
    });

    describe("#put", () => {

        //
        // PUT SHOULD NOT BE USED
        //
        // This method has been added only because it is needed for
        // Stream->Stream copies.  There are not tests for it because
        // it should not be exposed further upstream.  For 'put'
        // specific tests, see the 'copy_to' tests.

    });

    describe("#fetch_n_bytes", () => {

        it("should fetch the correct number of bytes", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });
            let bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\foo\\bar.txt", "abcd");

            bs.open();
            bs.load_from_file("C:\\foo\\bar.txt");

            assert.deepEqual(bs.fetch_n_bytes(1), Buffer.from("a"));
            assert.deepEqual(bs.fetch_n_bytes(1), Buffer.from("b"));
            assert.deepEqual(bs.fetch_n_bytes(1), Buffer.from("c"));
            assert.deepEqual(bs.fetch_n_bytes(5), Buffer.from("d"));
            done();
        });

        it("should return an empty string if there are no bytes in the stream to read", (done) => {

            let bs = new BinaryStream();
            bs.open();
            bs.position = 0;
            assert.equal(bs.fetch_n_bytes(2), "");
            done();
        });
    });

    describe("#fetch_all", () => {

        it("should fetch all chars from pos to EOB (end-of-buffer)", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });
            let bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\foo\\bar.txt", "abcd");

            bs.open();
            bs.load_from_file("C:\\foo\\bar.txt");

            assert.equal(bs.fetch_all(), "abcd");
            assert.equal(bs.position, 4);
            done();
        });

        it("should fetch all chars from pos to EOB (when pos != 0)", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });
            let bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\foo\\bar.txt", "abcdefghi");

            bs.open();
            bs.load_from_file("C:\\foo\\bar.txt");
            bs.position = 6;

            assert.equal(bs.fetch_all(), "ghi");
            assert.equal(bs.position, 9);
            done();
        });

        it("should return an empty string if the buffer is empty", (done) => {

            let bs = new BinaryStream();
            bs.open();
            assert.equal(bs.fetch_all(), "");
            assert.equal(bs.position, 0);

            done();
        });
    });

    describe(".position", () => {

        it("should allow .position to be updated, so long as it is within acceptable range", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} }),
                bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\file_1.txt", "abcdef");

            bs.open();
            bs.load_from_file("C:\\file_1.txt");

            for (let i = 0; i < "abcdef".length; i++) {
                assert.doesNotThrow(() => bs.position = i);
            }

            assert.throws(() => bs.position = "abcdef".length + 1);

            done();
        });

        it("should update acceptable range values for .position when used with #set_EOS", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} }),
                bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\file_1.txt", "abcdef");

            bs.open();
            bs.load_from_file("C:\\file_1.txt");

            for (let i = 0; i < "abcdef".length; i++) {
                assert.doesNotThrow(() => bs.position = i);
            }
            assert.throws(() => bs.position = "abcdef".length + 1);

            // Set pos, then update EOS to truncate stream...
            bs.position = 3;
            bs.set_EOS();

            assert.throws(() => bs.position = bs.size + 1);
            assert.equal(bs.position, 3);
            assert.equal(bs.size, 3);
            done();
        });

        it("should clear the buffer each time 'load_from_file' is called", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} }),
                bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\file_1.txt", "abcd");
            vfs.AddFile("C:\\file_2.txt", "1234567890");

            bs.open();

            bs.load_from_file("C:\\file_1.txt");
            assert.equal(bs.size, 4);
            bs.position = 4;
            assert.equal(bs.position, 4);
            assert.deepEqual(bs.fetch_all(), Buffer.alloc(0));

            bs.load_from_file("C:\\file_2.txt");
            assert.equal(bs.size, 10);
            assert.equal(bs.position, 0);
            assert.deepEqual(bs.fetch_all(), Buffer.from("1234567890", "ascii"));

            done();
        });

        it("should throw when .position is called on an unopened stream", (done) => {
            let bs = new BinaryStream();
            assert.throws(function () { bs.position; });
            done();
        });

        it("should report a position of zero when stream is open but not written to.", (done) => {
            let bs = new BinaryStream();
            bs.open();
            assert(bs.position === 0, "Position is zero when not written to.");
            done();
        });

        it("should not advance position when empty files are read-in", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} }),
                bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\file_1.txt", "");

            bs.open();
            bs.load_from_file("C:\\file_1.txt");

            assert.equal(bs.position, 0);
            assert.equal(bs.size, 0);

            done();
        });

        it("should throw if position is set higher than string len", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} }),
                bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\file_1.txt", "abcdef");
            bs.open();
            bs.load_from_file("C:\\file_1.txt");

            assert.equal(bs.position, 0);
            assert.doesNotThrow(() => bs.position = 6);
            assert.throws(() => bs.position = 7);
            assert.throws(() => bs.position = -1);

            done();
        });
    });

    describe(".size", () => {

        it("should throw when size is requested on an unopened stream.", (done) => {
            let bs = new BinaryStream();
            assert.throws(function () { bs.size(); });
            done();
        });

        it("should report the size as zero for an open but not written-to stream.", (done) => {

            let bs = new BinaryStream();
            bs.open();
            assert(bs.size === 0, "size is zero");
            done();
        });

        it("should not advance position when empty files are read-in", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} }),
                bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\file_1.txt", "");

            bs.open();
            bs.load_from_file("C:\\file_1.txt");

            assert.equal(bs.position, 0);
            assert.equal(bs.size, 0);

            done();
        });

        it("should report the size correctly for a binary file.", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} }),
                bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\file_1.txt", Buffer.alloc(8, 0xFF));

            bs.open();
            bs.load_from_file("C:\\file_1.txt");

            assert.equal(bs.position, 0);
            assert.equal(bs.size, 8);

            done();
        });

        it("should load files into buffer as UTF-16", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} }),
                bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\file_1.txt", "Hello, World!");

            bs.open();
            bs.load_from_file("C:\\file_1.txt");

            assert.equal(bs.position, 0);
            assert.equal(bs.size, 13);

            done();
        });
    });

    describe("#set_EOS", () => {

        it("should clear the stream when 'set_EOS' is called when pos = 0", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });
            let bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\foo\\bar.txt", "abcd");

            bs.open();
            bs.load_from_file("C:\\foo\\bar.txt");
            assert.equal(bs.position, 0);
            assert.equal(bs.size, 4);

            bs.position = 0;

            assert.doesNotThrow(() => bs.set_EOS());

            assert.equal(bs.size,     0);
            assert.equal(bs.position, 0);

            done();
        });

        it("should trunace existing bytes when called and .pos is not EOS", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });
            let bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\foo\\bar.txt", "abcdef");

            bs.open();
            bs.load_from_file("C:\\foo\\bar.txt");
            assert.equal(bs.position, 0);
            assert.equal(bs.size, 6);

            bs.position = 4;

            assert.doesNotThrow(() => bs.set_EOS());

            assert.equal(bs.size,     4);
            assert.equal(bs.position, 4);

            bs.position = 0;
            assert.deepEqual(bs.fetch_all(), Buffer.from("abcd", "ascii"));

            done();
        });
    });

    // TODO: Type Type is writable only when pos = 0, all other times
    // it's read only.  Need a test for this.

    describe("#copy_to", () => {

        it("should throw when trying to copy bin -> txt streams", (done) => {

            let vfs       = new VirtualFileSystem({ register: () => {} });
            let srcstream = new BinaryStream({ vfs: vfs }),
                dststream = new TextStream({ vfs: vfs });

            vfs.AddFile("C:\\foo\\bar.txt", "abcd");

            srcstream.open();
            dststream.open();

            srcstream.load_from_file("C:\\foo\\bar.txt");

            assert.throws(() => srcstream.copy_to(dststream));
            done();
        });

        it("should copy from bin -> bin streams", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });

            vfs.AddFile("C:\\foo\\bar.txt", "abcd");

            let srcstream = new BinaryStream({ vfs: vfs }),
                dststream = new BinaryStream({ vfs: vfs });

            srcstream.open();
            dststream.open();

            srcstream.load_from_file("C:\\foo\\bar.txt");
            assert.equal(srcstream.position, 0);
            assert.deepEqual(srcstream.fetch_all(), Buffer.from("abcd"));
            srcstream.position = 0;

            srcstream.copy_to(dststream);

            assert.deepEqual(srcstream.fetch_all(), dststream.fetch_all());
            assert.equal(srcstream.position, 4);
            assert.equal(dststream.position, 4);

            done();
        });

        it("should copy bin -> bin streams when the src & dst streams pos' != 0", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });

            vfs.AddFile("C:\\foo\\bar.txt", "abcdef");
            vfs.AddFile("C:\\baz.txt",      "ABCDEF");

            let srcstream = new BinaryStream({ vfs: vfs }),
                dststream = new BinaryStream({ vfs: vfs });

            srcstream.open();
            dststream.open();

            srcstream.load_from_file("C:\\foo\\bar.txt");
            dststream.load_from_file("C:\\baz.txt");

            dststream.position = 4;
            srcstream.position = 0;

            srcstream.copy_to(dststream);

            dststream.position = 0;
            srcstream.position = 0;

            assert.deepEqual(dststream.fetch_all(), Buffer.from("ABCDabcdef"));

            done();
        });
    });

    describe("load_from_file", () => {

        it("should load from a file, if that file exists", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });
            let bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\foo\\bar.txt", "abcd");

            bs.open();
            const file_path = "C:\\foo\\bar.txt";

            bs.load_from_file(file_path);

            assert.equal(bs.position, 0);
            assert.deepEqual(bs.fetch_all(), Buffer.from("abcd"));

            done();
        });

        it("should throw if the file does not exist", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });
            let bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\foo\\bar.txt", "abcd");

            bs.open();
            const file_path = "C:\\foo.txt";

            assert.throws(() => bs.load_from_file(file_path));
            done();
        });
    });

    describe("#to_text_stream", () => {

        it("should maintain the correct size while being converted from bin -> txt", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });
            let ts  = new TextStream({ vfs: vfs });

            const msg = "abcd";

            ts.open();
            vfs.AddFile("C:\\some_file.txt", msg);

            // First, create a new text stream and put our message in it.
            ts.put(msg);
            assert.equal(ts.size, 10); // Using UTF16-LE encoding.

            let bs = ts.to_binary_stream();

            assert.equal(ts.type, 2);
            assert.equal(bs.type, 1);

            assert.equal(ts.size, 10);
            assert.equal(bs.size, 10);

            done();
        });

        it("should return a copy as a text stream", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });
            let bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\foo\\bar.txt", "abcd");

            bs.open();
            bs.load_from_file("C:\\foo\\bar.txt");

            let ts = bs.to_text_stream();

            assert.equal(ts.type, 2);
            assert.equal(ts.size, 4);

            done();
        });

        it("should convert to a binary stream, copying across position", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });
            let bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\foo\\bar.txt", "Hello, World!");

            bs.open();
            bs.load_from_file("C:\\foo\\bar.txt");
            bs.position = 5;

            let ts = bs.to_text_stream();

            assert.equal(ts.type, 2);
            assert.equal(ts.position, 5);

            done();
        });

        it("should convert to a binary stream, copying across open/closed status", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });
            let bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\foo\\bar.txt", "Hello, World!");

            bs.open();
            bs.load_from_file("C:\\foo\\bar.txt");
            bs.position = 5;

            bs.close();

            let ts = bs.to_text_stream();

            assert.equal(ts.type, 2);
            assert.isTrue(ts.is_closed);

            done();
        });
    });
});
