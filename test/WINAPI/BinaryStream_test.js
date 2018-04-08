const assert = require("chai").assert;
const BinaryStream = require("../../src/winapi/support/BinaryStream");
const TextStream = require("../../src/winapi/support/TextStream");
const VirtualFileSystem = require("../../src/runtime/virtfs");

describe("BinaryStream", () => {

    xdescribe(".charset", () => {

        it("Should throw if '.charset' is assigned-to", (done) => {

            let bs = new BinaryStream();
            assert.throws(() => { bs.charset = "ascii"; });
            done();
        });
    });

    xdescribe("#open", () => {

        it("Should throw if an unopened stream is written to.", (done) => {
            let bs = new BinaryStream();
            assert.throws(function () { bs.load_from_file("C:\\foo\\bar.txt"); });
            done();
        });

        it("Should throw if an opened stream has been closed and is written to.", (done) => {

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

    xdescribe("#put", () => {

        it("Should throw if 'put' is called - not allowed in BinaryStreams.", (done) => {

            let bs = new BinaryStream();
            bs.open();
            assert.throws(function () { bs.put("testing..."); });
            done();
        });

    });

    xdescribe("#fetch_n_bytes", () => {

        it("Should fetch the correct number of bytes", (done) => {

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

        it("Should return an empty string if there are no bytes in the stream to read", (done) => {

            let bs = new BinaryStream();
            bs.open();
            bs.position = 0;
            assert.equal(bs.fetch_n_bytes(2), "");
            done();
        });
    });

    xdescribe("#fetch_line", () => {

        it("Default should fetch up to the first CRLF", (done) => {

            let bs = new BinaryStream();
            bs.open();
            bs.put("abcd\r\nefgh\r\n");
            bs.position = 0;

            assert.equal(bs.fetch_line(), "abcd");
            assert.equal(bs.position, 12);

            assert.equal(bs.fetch_line(), "efgh");
            assert.equal(bs.position, 24);

            assert.equal(bs.fetch_line(), "");
            assert.equal(bs.position, 24);

            bs.position = 0;
            assert.equal(bs.fetch_all(), "abcd\r\nefgh\r\n");

            done();
        });

        it("Should return an empty string when at the end of the buffer", (done) => {

            let bs = new BinaryStream();
            bs.open();
            bs.put("abcd\r\n");

            assert.equal(bs.fetch_line(), "");
            assert.equal(bs.position, 12);
            done();
        });

        it("Should return the whole string when CRLF cannot be found", (done) => {

            let bs = new BinaryStream();
            bs.open();
            bs.put("abcd");

            bs.position = 0;
            assert.equal(bs.fetch_line(), "abcd");
            assert.equal(bs.position, 8);

            done();
        });

        it("Should handle the case where the whole string is CRLF pairs", (done) => {

            let bs = new BinaryStream();
            bs.open();
            bs.put("\r\n\r\n\r\n\r\n");
            bs.separator = -1;
            bs.position = 0;

            assert.equal(bs.fetch_line(), "");
            assert.equal(bs.position, 4);

            assert.equal(bs.fetch_line(), "");
            assert.equal(bs.position, 8);

            assert.equal(bs.fetch_line(), "");
            assert.equal(bs.position, 12);

            assert.equal(bs.fetch_line(), "");
            assert.equal(bs.position, 16);

            assert.equal(bs.fetch_line(), "");
            assert.equal(bs.position, 16);

            done();
        });

        describe("line separator specific", () => {

            it("Should throw if the sep value isn't CR, CRLF, or LF", (done) => {

                let bs = new BinaryStream();
                bs.open();

                assert.throws(() => bs.separator = "\r\n");
                assert.throws(() => bs.separator = "\n");
                assert.throws(() => bs.separator = "\r");
                assert.throws(() => bs.separator = 0);
                assert.throws(() => bs.separator = 1);

                assert.doesNotThrow(() => bs.separator = -1);
                assert.doesNotThrow(() => bs.separator = 13);
                assert.doesNotThrow(() => bs.separator = 10);

                done();
            });

            it("Should change to LF", (done) => {

                let bs = new BinaryStream();
                bs.open();
                bs.put("abcd\r\nefgh\r\n");

                bs.separator = 10; // LF
                bs.position = 0;
                assert.equal(bs.fetch_line(), "abcd\r");
                assert.equal(bs.fetch_line(), "efgh\r");

                assert.equal(bs.position, 24);

                done();

            });

            it("Should change to CR", (done) => {

                let bs = new BinaryStream();
                bs.open();
                bs.put("abcd\rdefg\r\r");

                bs.position = 0;
                bs.separator = 13; // CR

                assert.equal(bs.fetch_line(), "abcd");
                assert.equal(bs.position, 10);

                assert.equal(bs.fetch_line(), "defg");
                assert.equal(bs.position, 20);

                assert.equal(bs.fetch_line(), "");
                assert.equal(bs.position, 22);

                done();
            });
        });
    });

    xdescribe("#fetch_all", () => {

        it("Should fetch all chars from pos to EOB (end-of-buffer)", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });
            let bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\foo\\bar.txt", "abcd");

            bs.open();
            bs.load_from_file("C:\\foo\\bar.txt");

            assert.equal(bs.fetch_all(), "abcd");
            assert.equal(bs.position, 4);
            done();
        });

        it("Should fetch all chars from pos to EOB (when pos != 0)", (done) => {

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

        it("Should return an empty string if the buffer is empty", (done) => {

            let bs = new BinaryStream();
            bs.open();
            assert.equal(bs.fetch_all(), "");
            assert.equal(bs.position, 0);

            done();
        });
    });

    // TODO ...
    xdescribe("#skipline", () => {

        it("Should default to CRLF without changing LineSep (default)", (done) => {

            let bs = new BinaryStream();
            bs.open();
            bs.type = 2;
            bs.put("abc\r\ndef\r\nghi");

            bs.position = 0;
            bs.skipline();

            assert.equal(bs.position, 10);
            done();
        });

        it("Should continue skipping lines until there are no more left to skip", (done) => {

            let bs = new BinaryStream();
            bs.open();
            bs.type = 2;
            bs.put("abc\r\ndef\r\nghi\r\n");

            bs.position = 0;

            bs.skipline();
            assert.equal(bs.position, 10);

            bs.skipline();
            assert.equal(bs.position, 20);

            bs.skipline();
            assert.equal(bs.position, 30);

            bs.skipline();
            bs.skipline();
            bs.skipline();
            bs.skipline();
            assert.equal(bs.position, 30);

            done();

        });

        it("Should read up to LF if set", (done) => {

            let bs = new BinaryStream();
            bs.open();
            bs.type = 2;
            bs.put("abc\ndef");
            bs.position = 0;
            bs.skipline(10); // 10 = enum value for LF
            assert.equal(bs.position, 8);
            done();
        });

    });


    describe(".position", () => {

        xit("Should allow .position to be updated, so long as it is within acceptable range", (done) => {

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

        xit("Should update acceptable range values for .position when used with #set_EOS", (done) => {

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

        it("Should clear the buffer each time 'load_from_file' is called", (done) => {

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

        it("Should throw when .position is called on an unopened stream", (done) => {
            let bs = new BinaryStream();
            assert.throws(function () { bs.position; });
            done();
        });

        it("Should report a position of zero when stream is open but not written to.", (done) => {
            let bs = new BinaryStream();
            bs.open();
            assert(bs.position === 0, "Position is zero when not written to.");
            done();
        });

        it("Should not advance position when empty files are read-in", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} }),
                bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\file_1.txt", "");

            bs.open();
            bs.load_from_file("C:\\file_1.txt");

            assert.equal(bs.position, 0);
            assert.equal(bs.size, 0);

            done();
        });

        it("Should throw if position is set higher than string len", (done) => {

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

    xdescribe(".size", () => {

        it("Should throw when size is requested on an unopened stream.", (done) => {
            let bs = new BinaryStream();
            assert.throws(function () { bs.size(); });
            done();
        });

        it("Should report the size as zero for an open but not written-to stream.", (done) => {

            let bs = new BinaryStream();
            bs.open();
            assert(bs.size === 0, "size is zero");
            done();
        });

        it("Should not advance position when empty files are read-in", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} }),
                bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\file_1.txt", "");

            bs.open();
            bs.load_from_file("C:\\file_1.txt");

            assert.equal(bs.position, 0);
            assert.equal(bs.size, 0);

            done();
        });

        it("Should report the size correctly for a binary file.", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} }),
                bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\file_1.txt", Buffer.alloc(8, 0xFF));

            bs.open();
            bs.load_from_file("C:\\file_1.txt");

            assert.equal(bs.position, 0);
            assert.equal(bs.size, 8);

            done();
        });
    });

    describe("#set_EOS", () => {

        it("Should clear the stream when 'set_EOS' is called when pos = 0", (done) => {

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

        it("Should trunace existing bytes when called and .pos is not EOS", (done) => {

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


    describe("#copy_to", () => {

        xit("Should throw when trying to copy bin -> txt streams", (done) => {

            let vfs       = new VirtualFileSystem({ register: () => {} });
            let srcstream = new BinaryStream({ vfs: vfs }),
                dststream = new TextStream({ vfs: vfs });

            vfs.AddFile("C:\\foo\\bar.txt", "abcd");

            srcstream.open();
            dststream.open();

            srcstream.open();
            srcstream.load_from_file("C:\\foo\\bar.txt");

            assert.throws(() => srcstream.copy_to(dststream));
            done();
        });

        it("Should copy from bin -> bin streams", (done) => {

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

        it("Should copy bin -> bin streams when the src & dst streams pos' != 0", (done) => {

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

    xdescribe("load_from_file", () => {

        it("Should load from a file, if that file exists", (done) => {

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

        it("Should throw if the file does not exist", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });
            let bs  = new BinaryStream({ vfs: vfs });

            vfs.AddFile("C:\\foo\\bar.txt", "abcd");

            bs.open();
            const file_path = "C:\\foo.txt";

            assert.throws(() => bs.load_from_file(file_path));
            done();
        });
    });

});
