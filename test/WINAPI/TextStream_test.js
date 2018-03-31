const assert = require("chai").assert;
const TextStream = require("../../src/winapi/support/TextStream");

describe("TextStream", () => {

    describe("#open", () => {

        it("Should throw if an unopened stream is written to.", (done) => {
            let ts = new TextStream();
            assert.throws(function () { ts.put("testing..."); });
            done();
        });

        it("Should throw if an opened stream has been closed and is written to.", (done) => {
            let ts = new TextStream();
            ts.open();
            assert.doesNotThrow(function () { ts.put("testing..."); });
            ts.close();
            assert.throws(function () { ts.put("testing..."); });
            done();
        });

        // todo add fetch-throws

    });

    describe("#put", () => {

        it("Should allow writing to an opened stream.", (done) => {

            let ts = new TextStream();
            ts.open();
            assert.doesNotThrow(function () { ts.put("testing..."); });
            done();
        });

        it("Should add CRLF when options == 1.", (done) => {

            let ts = new TextStream();
            ts.open();

            ts.put("", 1);
            assert.equal(ts.size, 4);

            ts.put("abc", 1);
            assert.equal(ts.size, 14);

            done();
        });

    });

    describe("#fetch_n_chars", () => {

        it("Should fetch the correct number of chars", (done) => {

            let ts = new TextStream();
            ts.open();
            ts.put("abcd");
            ts.position = 0;

            assert.equal(ts.fetch_n_chars(1), "a");
            assert.equal(ts.fetch_n_chars(1), "b");
            assert.equal(ts.fetch_n_chars(1), "c");
            assert.equal(ts.fetch_n_chars(5), "d");
            done();
        });

        it("Should return an empty string if there are no chars to read", (done) => {

            let ts = new TextStream();
            ts.open();
            ts.position = 0;
            assert.equal(ts.fetch_n_chars(2), "");
            done();
        });
    });

    describe("#fetch_line", () => {

        it("Default should fetch up to the first CRLF", (done) => {

            let ts = new TextStream();
            ts.open();
            ts.put("abcd\r\nefgh\r\n");
            ts.position = 0;

            assert.equal(ts.fetch_line(), "abcd");
            assert.equal(ts.position, 12);

            assert.equal(ts.fetch_line(), "efgh");
            assert.equal(ts.position, 24);

            assert.equal(ts.fetch_line(), "");
            assert.equal(ts.position, 24);

            ts.position = 0;
            assert.equal(ts.fetch_all(), "abcd\r\nefgh\r\n");

            done();
        });

        it("Should return an empty string when at the end of the buffer", (done) => {

            let ts = new TextStream();
            ts.open();
            ts.put("abcd\r\n");

            assert.equal(ts.fetch_line(), "");
            assert.equal(ts.position, 12);
            done();
        });

        it("Should return the whole string when CRLF cannot be found", (done) => {

            let ts = new TextStream();
            ts.open();
            ts.put("abcd");

            ts.position = 0;
            assert.equal(ts.fetch_line(), "abcd");
            assert.equal(ts.position, 8);

            done();
        });

        it("Should handle the case where the whole string is CRLF pairs", (done) => {

            let ts = new TextStream();
            ts.open();
            ts.put("\r\n\r\n\r\n\r\n");
            ts.separator = -1;
            ts.position = 0;

            assert.equal(ts.fetch_line(), "");
            assert.equal(ts.position, 4);

            assert.equal(ts.fetch_line(), "");
            assert.equal(ts.position, 8);

            assert.equal(ts.fetch_line(), "");
            assert.equal(ts.position, 12);

            assert.equal(ts.fetch_line(), "");
            assert.equal(ts.position, 16);

            assert.equal(ts.fetch_line(), "");
            assert.equal(ts.position, 16);

            done();
        });

        describe("line separator specific", () => {

            it("Should throw if the sep value isn't CR, CRLF, or LF", (done) => {

                let ts = new TextStream();
                ts.open();

                assert.throws(() => ts.separator = "\r\n");
                assert.throws(() => ts.separator = "\n");
                assert.throws(() => ts.separator = "\r");
                assert.throws(() => ts.separator = 0);
                assert.throws(() => ts.separator = 1);

                assert.doesNotThrow(() => ts.separator = -1);
                assert.doesNotThrow(() => ts.separator = 13);
                assert.doesNotThrow(() => ts.separator = 10);

                done();
            });

            it("Should change to LF", (done) => {

                let ts = new TextStream();
                ts.open();
                ts.put("abcd\r\nefgh\r\n");

                ts.separator = 10; // LF
                ts.position = 0;
                assert.equal(ts.fetch_line(), "abcd\r");
                assert.equal(ts.fetch_line(), "efgh\r");

                assert.equal(ts.position, 24);

                done();

            });

            it("Should change to CR", (done) => {

                let ts = new TextStream();
                ts.open();
                ts.put("abcd\rdefg\r\r");

                ts.position = 0;
                ts.separator = 13; // CR

                assert.equal(ts.fetch_line(), "abcd");
                assert.equal(ts.position, 10);

                assert.equal(ts.fetch_line(), "defg");
                assert.equal(ts.position, 20);

                assert.equal(ts.fetch_line(), "");
                assert.equal(ts.position, 22);

                done();
            });
        });
    });

    describe("#fetch_all", () => {

        it("Should fetch all chars from pos to EOB (end-of-buffer)", (done) => {

            let ts = new TextStream();
            ts.open();
            ts.put("abcd");
            ts.position = 0;
            assert.equal(ts.fetch_all(), "abcd");
            assert.equal(ts.position, 8);
            done();
        });

        it("Should fetch all chars from pos to EOB (when pos != 0)", (done) => {

            let ts = new TextStream();
            ts.open();
            ts.put("abcdef");
            ts.position = 6;

            assert.equal(ts.fetch_all(), "def");
            assert.equal(ts.position, 12);
            done();
        });

        it("Should return encoded chars forward from pos", (done) => {

            let ts = new TextStream();
            ts.open();
            ts.put("abcd");
            ts.position = 1;

            let output_str = ts.fetch_all(),
                expected   = [ 25088, 25344, 25600 ];

            for (let i = 0; i < expected.length; i++) {
                assert.equal(output_str.charCodeAt(i), expected[i]);
            }

            assert.equal(ts.position, 8);

            done();
        });

        it("Should return an empty string if the buffer is empty", (done) => {

            let ts = new TextStream();
            ts.open();
            assert.equal(ts.fetch_all(), "");
            assert.equal(ts.position, 0);

            done();
        });
    });

    describe("#skipline", () => {

        it("Should default to CRLF without changing LineSep (default)", (done) => {

            let ts = new TextStream();
            ts.open();
            ts.type = 2;
            ts.put("abc\r\ndef\r\nghi");

            ts.position = 0;
            ts.skipline();

            assert.equal(ts.position, 10);
            done();
        });

        it("Should continue skipping lines until there are no more left to skip", (done) => {

            let ts = new TextStream();
            ts.open();
            ts.type = 2;
            ts.put("abc\r\ndef\r\nghi\r\n");

            ts.position = 0;

            ts.skipline();
            assert.equal(ts.position, 10);

            ts.skipline();
            assert.equal(ts.position, 20);

            ts.skipline();
            assert.equal(ts.position, 30);

            ts.skipline();
            ts.skipline();
            ts.skipline();
            ts.skipline();
            assert.equal(ts.position, 30);

            done();

        });

        it("Should read up to LF if set", (done) => {

            let ts = new TextStream();
            ts.open();
            ts.type = 2;
            ts.put("abc\ndef");
            ts.position = 0;
            ts.skipline(10); // 10 = enum value for LF
            assert.equal(ts.position, 8);
            done();
        });

    });


    describe(".position", () => {

        // TODO: what happens if I do this:
        //
        // ts.open();
        // ts.put("abc");
        // ts.position = 2;
        // ts.put("xyz");
        // ts.fetch_all() => ?
        //
        //
        it("Should overwrite chars when position is changed", (done) => {

            let ts = new TextStream();
            ts.open();
            ts.put("abcd");
            ts.position = 2;
            ts.put("123456");

            ts.position = 0;
            assert.equal(ts.fetch_all(), "a123456");
            done();
        });

        it("Should throw when .position is called on an unopened stream", (done) => {

            let ts = new TextStream();
            assert.throws(function () { ts.position; });
            done();
        });

        it("Should report a position of zero when stream is open but not written to.", (done) => {

            let ts = new TextStream();
            ts.open();
            assert(ts.position === 0, "Position is zero when not written to.");
            done();
        });

        it("Should not advance position when empty strings are written.", (done) => {

            let ts = new TextStream();
            ts.open();
            assert(ts.position === 0, "Position is zero when stream is not written to.");

            ts.put("");
            assert(ts.position === 0, "Position remains at zero when a blank string is written.");

            ts.put("");
            assert(ts.position === 0, "Position remains at zero when another blank string is written.");

            done();
        });

        it("Should advance 'position' by 2 bytes for a single char written to the stream.", (done) => {

            let ts = new TextStream();
            ts.open();

            ts.put("a");
            assert(ts.position === 2, "Position is 2");

            ts.put("b");
            assert(ts.position === 4, "Position is now 4");

            ts.put("cdef");
            assert(ts.position === 12, "Position is now 12");

            ts.position = 0;
            assert.equal(ts.fetch_all(), "abcdef");

            done();
        });

        it("Should throw if position is set higher than string len", (done) => {

            let ts = new TextStream();
            ts.open();

            ts.put("abc");

            assert.equal(ts.position, 6);
            assert.doesNotThrow(() => ts.position = 6);
            assert.throws(() => ts.position = 7);

            done();
        });

        it("Should put in to the correct position when position is changed.", (done) => {

            let ts = new TextStream();
            ts.open();

            ts.put("abcd");
            assert(ts.position === 8, `Expected ts.position is: ${ts.position}, expected 8`);

            ts.position = 2;
            ts.put("efgh");
            assert.equal(ts.position, 10);

            ts.position = 0;
            assert.equal(ts.position, 0);

            ts.put("blah");
            assert.equal(ts.position, 8);

            done();
        });
    });

    describe(".size", () => {

        it("Should throw when size is requested on an unopened stream.", (done) => {
            let ts = new TextStream();
            assert.throws(function () { ts.size(); });
            done();
        });

        it("Should report the size as zero for an open but not written-to stream.", (done) => {

            let ts = new TextStream();
            ts.open();
            assert(ts.size === 0, "size is zero");
            done();
        });

        it("Should report the size as zero for an empty string written to the stream.", (done) => {

            let ts = new TextStream();
            ts.open();
            ts.put("");
            assert(ts.size === 0, "Size is equal to zero for empty string");
            done();
        });

        it("Should report the size correctly for UTF16LE strings.", (done) => {

            let ts = new TextStream();
            ts.open();
            ts.put("abc");
            assert.equal(ts.size, 6);
            done();
        });
    });
});
