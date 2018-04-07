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


    xdescribe(".position", () => {

        it("Should overwrite chars when position is changed", (done) => {

            let bs = new BinaryStream();
            bs.open();
            bs.put("abcd");
            bs.position = 2;
            bs.put("123456");

            bs.position = 0;
            assert.equal(bs.fetch_all(), "a123456");
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

        it("Should not advance position when empty strings are written.", (done) => {

            let bs = new BinaryStream();
            bs.open();
            assert(bs.position === 0, "Position is zero when stream is not written to.");

            bs.put("");
            assert(bs.position === 0, "Position remains at zero when a blank string is written.");

            bs.put("");
            assert(bs.position === 0, "Position remains at zero when another blank string is written.");

            done();
        });

        it("Should advance 'position' by 2 bytes for a single char written to the stream.", (done) => {

            let bs = new BinaryStream();
            bs.open();

            bs.put("a");
            assert(bs.position === 2, "Position is 2");

            bs.put("b");
            assert(bs.position === 4, "Position is now 4");

            bs.put("cdef");
            assert(bs.position === 12, "Position is now 12");

            bs.position = 0;
            assert.equal(bs.fetch_all(), "abcdef");

            done();
        });

        it("Should throw if position is set higher than string len", (done) => {

            let bs = new BinaryStream();
            bs.open();

            bs.put("abc");

            assert.equal(bs.position, 6);
            assert.doesNotThrow(() => bs.position = 6);
            assert.throws(() => bs.position = 7);

            done();
        });

        it("Should put in to the correct position when position is changed.", (done) => {

            let bs = new BinaryStream();
            bs.open();

            bs.put("abcd");
            assert(bs.position === 8, `Expected bs.position is: ${bs.position}, expected 8`);

            bs.position = 2;
            bs.put("efgh");
            assert.equal(bs.position, 10);

            bs.position = 0;
            assert.equal(bs.position, 0);

            bs.put("blah");
            assert.equal(bs.position, 8);

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

        it("Should report the size as zero for an empty string written to the stream.", (done) => {

            let bs = new BinaryStream();
            bs.open();
            bs.put("");
            assert(bs.size === 0, "Size is equal to zero for empty string");
            done();
        });

        it("Should report the size correctly for UTF16LE strings.", (done) => {

            let bs = new BinaryStream();
            bs.open();
            bs.put("abc");
            assert.equal(bs.size, 6);
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

        xit("Should copy bin -> bin streams when the src stream's pos isn't EOS", (done) => {

            let vfs = new VirtualFileSystem({ register: () => {} });

            vfs.AddFile("C:\\foo\\bar.txt", "abcdef");
            vfs.AddFile("C:\\baz.txt",      "ABCDEF");

            let srcstream = new BinaryStream({ vfs: vfs }),
                dststream = new BinaryStream({ vfs: vfs });

            srcstream.open();
            dststream.open();

            srcstream.load_from_file("C:\\foo\\bar.txt");

            dststream.load_from_file("C:\\baz.txt");
            dststream.position = 0;

            assert.equal(srcstream.position, 0);
            assert.equal(dststream.position, 0);

            // TODO...

            assert.deepEqual(srcstream.fetch_n_bytes(3), Buffer.from("abc"));
            assert.equal(srcstream.position, 3);

            srcstream.copy_to(dststream);

            assert.deepEqual(dststream.fetch_all(), srcstream);

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
