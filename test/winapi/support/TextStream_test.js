const assert = require("chai").assert;
const TextStream = require("../../../src/winapi/support/TextStream");
const VirtualFileSystem = require("../../../src/runtime/virtfs");
const iconv = require("iconv-lite");
const make_context = require("../../testlib");

var context;

describe("TextStream", () => {

    beforeEach(() => context = make_context());

    describe("#open", () => {

        it("should throw if an unopened stream is written to.", () => {
            let ts = new TextStream(context);
            assert.throws(function () { ts.put("testing..."); });

        });

        it("should throw if an opened stream has been closed and is written to.", () => {
            let ts = new TextStream(context);
            ts.open();
            assert.doesNotThrow(function () { ts.put("testing..."); });
            ts.close();
            assert.throws(function () { ts.put("testing..."); });

        });

        it("should throw if an opened stream is opened again", () => {

            let ts = new TextStream(context);
            assert.doesNotThrow(() => ts.open());
            assert.isTrue(ts.is_open);

            assert.throws(() => ts.open(), "Cannot open an already opened stream.");


        });
    });

    describe("#close", () => {

        it("should set the position to zero when closed/opened", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.put("abcd");

            assert.equal(ts.position, 10);

            ts.close();
            ts.open();
            assert.equal(ts.position, 0);


        });

    });

    describe("#put", () => {

        it("should allow writing to an opened stream.", () => {

            let ts = new TextStream(context);
            ts.open();
            assert.doesNotThrow(function () { ts.put("testing..."); });

        });

        it("should handle correctly inserting ASCII text in to the stream", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.charset = "ascii";

            ts.put("abcd");
            assert.equal(ts.size, 4);

            ts.position = 2;
            ts.put("x");

            ts.position = 0;
            assert.equal(ts.fetch_all(), "abxd");

            ts.position = 0;
            ts.put("wxyzz1234");
            ts.position = 0;
            assert.equal(ts.fetch_all(), "wxyzz1234");

            ts.position = 5;
            ts.put("abcdefghi");
            ts.position = 0;
            assert.equal(ts.fetch_all(), "wxyzzabcdefghi");


        });

        it("should handle correctly inserting Unicode text in to the stream", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.charset = "Unicode";

            ts.put("abcd");
            assert.equal(ts.size, 10);

            // Setting a Unicode stream's `.pos' to zero should skip
            // forward 2 bytes, missing out the BOM.
            ts.position = 0;
            ts.put("x");

            ts.position = 0;
            assert.equal(ts.fetch_all(), "xbcd", "Overwrite the correct buffer portion.");

            ts.position = 0;
            ts.put("abcdefghij");
            ts.position = 0;
            assert.equal(ts.fetch_all(), "abcdefghij", "Overwrite the whole buffer.");

            ts.position = 10;
            assert.equal(ts.fetch_n_chars(1), "e", "Check fetch_n_chars is charset aware.");

            ts.position = 10;
            ts.put("XX");

            ts.position = 0;
            assert.equal(ts.fetch_all(), "abcdXXghij");


        });

        it("should not add the BOM when switching charset from ascii -> unicode", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.charset = "ascii";

            ts.put("abc");
            assert.equal(ts.position, 3);
            assert.equal(ts.size,     3);

            ts.position = 0;
            ts.charset  = "Unicode";

            assert.equal(ts.size, 3);
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0x6261);
            assert.equal(ts.position, 2);

            ts.position = 0;
            ts.charset = "ascii";
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0x61);


        });

        it("should add the BOM only once", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.charset = "Unicode";

            assert.equal(ts.size, 0);
            assert.equal(ts.position, 0);

            ts.put("");

            assert.equal(ts.size, 2, "size should include BOM");
            assert.equal(ts.position, 2, "position should include BOM");

            ts.put("abc");
            assert.equal(ts.size, 8);
            assert.equal(ts.position, 8);

            ts.position = 0;
            assert.equal(ts.fetch_n_chars(3), "abc");


        });

        it("should not strip the BOM when switching charset from unicode -> ascii", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.charset = "Unicode";

            ts.put("abc");
            assert.equal(ts.position, 8);
            assert.equal(ts.size, 8);

            ts.position = 0;
            ts.charset = "ascii";

            assert.equal(ts.size, 8);
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0xFF);
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0xFE);
            assert.equal(ts.position, 2);

            ts.position = 0;
            ts.charset = "Unicode";
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0x61);



        });
        it("should write the BOM when put is passed 'undefined'", () => {

            let ts = new TextStream(context);
            ts.open();
            assert.doesNotThrow(() => ts.put(undefined));

            assert.equal(ts.size, 2);
            assert.equal(ts.position, 2);


        });

        it("should throw when trying to write 'null' to the stream", () => {

            let ts = new TextStream(context);
            ts.open();
            assert.throws(() => ts.put(null), "cannot write null data to this stream");


        });

        it("should treat an empty array '[]' as an undefined value", () => {

            let ts = new TextStream(context);
            ts.open();

            assert.doesNotThrow(() => ts.put([]));
            assert.equal(ts.size, 2);
            assert.equal(ts.position, 2);


        });

        it("should convert an object to '[object Object]' when an object-write is attempted", () => {

            let ts = new TextStream(context);
            ts.open();

            // '{}' becomes '[object Object]'.
            assert.doesNotThrow(() => ts.put({}));

            assert.equal(ts.size, 32);
            assert.equal(ts.position, 32);


        });

        it("should correctly handle inserting Unicode text in to the stream", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.charset = "Unicode"; // default...

            ts.put("");
            assert.equal(ts.size, 2);
            assert.equal(ts.position, 2);

            ts.position = 0;
            ts.put("abc");
            assert.equal(ts.size, 8);

            ts.position = 0;
            assert.equal(ts.fetch_all(), "abc");


        });

        it("should add CRLF when options == 1.", () => {

            let ts = new TextStream(context);
            ts.open();

            ts.put("", 1);

            assert.equal(ts.size, 6, "Size should be BOM(2) + CR(2) + LF(2) == 6.");
            assert.equal(ts.position, 6);

            ts.put("abc", 1);

            assert.equal(ts.size, 16);
            assert.equal(ts.position, 16);


        });

        it("should throw if options value is neither 1 nor 0", () => {

            let ts = new TextStream(context);
            ts.open();

            assert.throws(() => ts.put("abc", 3));
            assert.throws(() => ts.put("abc", -1));
            assert.throws(() => ts.put("abc", 282712));

            assert.doesNotThrow(() => ts.put("abc"));
            assert.doesNotThrow(() => ts.put("abc", 1));
            assert.doesNotThrow(() => ts.put("abc", 0));


        });
    });

    describe("#fetch_n_chars", () => {

        // TODO: have to check if 'set_encoding_bytes === true' before
        // each of these.  Looks like Windows doesn't include the
        // encoding bytes in its output.  For example:
        //
        //   ado = ActiveXObject("ADODB.Stream");
        //   ado.type = 2; // text stream
        //   ado.writetext("abcdef");
        //   ado.position = 0;
        //   WScript.Echo(ado.readtext(2)); // prints "ab".
        //

        it("should correctly fetch chars when the encoding bytes are set", () => {

            let ts = new TextStream(context);

            ts.open();
            ts.put("abcdef");

            ts.position = 0;

            assert.equal(ts.fetch_n_chars(1), "a");
            assert.equal(ts.position, 4);
            assert.equal(ts.fetch_n_chars(1), "b");
            assert.equal(ts.position, 6);


        });

        it("should correctly fetch and encode text characters, including BOM", () => {

            let ts = new TextStream(context);

            ts.open();
            ts.put("abcdef");
            ts.position = 0;

            let expected = [
                { startPos:  0, charCodeAt: 97,     endPos:  4 },
                { startPos:  1, charCodeAt: 0x61fe, endPos:  3 },
                { startPos:  2, charCodeAt: 97,     endPos:  4 },
                { startPos:  3, charCodeAt: 0x6200, endPos:  5 },
                { startPos:  4, charCodeAt: 98,     endPos:  6 },
                { startPos:  5, charCodeAt: 0x6300, endPos:  7 },
                { startPos:  6, charCodeAt: 99,     endPos:  8 },
                { startPos:  7, charCodeAt: 0x6400, endPos:  9 },
                { startPos:  8, charCodeAt: 100,    endPos: 10 },
                { startPos:  9, charCodeAt: 0x6500, endPos: 11 },
                { startPos: 10, charCodeAt: 101,    endPos: 12 },
                { startPos: 11, charCodeAt: 0x6600, endPos: 13 },
                { startPos: 12, charCodeAt: 102,    endPos: 14 },
            ];

            expected.forEach((e) => {
                ts.position = e.startPos;
                assert.equal(ts.fetch_n_chars(1).charCodeAt(0), e.charCodeAt);
                assert.equal(ts.position, e.endPos);
            });


        });

        it("should return an empty string if there are no chars to read", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.position = 0;
            assert.equal(ts.fetch_n_chars(2), "");

        });
    });

    describe("#fetch_line", () => {

        it("should fetch up to the first CRLF by default", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.put("abcd\r\nefgh\r\n");
            ts.position = 0;

            assert.equal(ts.fetch_line(), "abcd");

            assert.equal(ts.fetch_line(), "efgh");
            assert.equal(ts.position, 26);

            assert.equal(ts.fetch_line(), "");
            assert.equal(ts.position, 26);

            ts.position = 0;
            assert.equal(ts.fetch_all(), "abcd\r\nefgh\r\n");


        });

        it("should return an empty string when at the end of the buffer", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.put("abcd\r\n");

            assert.equal(ts.fetch_line(), "");
            assert.equal(ts.position, 14);

        });

        it("should return the whole string when CRLF cannot be found", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.put("abcd");

            ts.position = 0;
            assert.equal(ts.fetch_line(), "abcd");
            assert.equal(ts.position, 10);


        });

        it("should handle the case where the whole string is CRLF pairs", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.put("\r\n\r\n\r\n\r\n");
            ts.separator = -1; // CRLF separator
            ts.position = 0;

            assert.equal(ts.fetch_line(), "");
            assert.equal(ts.position, 6);

            assert.equal(ts.fetch_line(), "");
            assert.equal(ts.position, 10);

            assert.equal(ts.fetch_line(), "");
            assert.equal(ts.position, 14);


            assert.equal(ts.fetch_line(), "");
            assert.equal(ts.position, 18);

            assert.equal(ts.fetch_line(), "");
            assert.equal(ts.position, 18);


        });

        describe("line separator specific", () => {

            it("should throw if the sep value isn't CR, CRLF, or LF", () => {

                let ts = new TextStream(context);
                ts.open();

                assert.throws(() => ts.separator = "\r\n");
                assert.throws(() => ts.separator = "\n");
                assert.throws(() => ts.separator = "\r");
                assert.throws(() => ts.separator = 0);
                assert.throws(() => ts.separator = 1);

                assert.doesNotThrow(() => ts.separator = -1);
                assert.doesNotThrow(() => ts.separator = 13);
                assert.doesNotThrow(() => ts.separator = 10);


            });

            it("should change to LF", () => {

                let ts = new TextStream(context);
                ts.open();
                ts.put("abcd\r\nefgh\r\n");

                ts.separator = 10; // LF
                ts.position = 0;
                assert.equal(ts.fetch_line(), "abcd\r");
                assert.equal(ts.fetch_line(), "efgh\r");

                assert.equal(ts.position, 26);



            });

            it("should change to CR", () => {

                let ts = new TextStream(context);
                ts.open();
                ts.put("abcd\rdefg\r\r");

                ts.position = 0;
                ts.separator = 13; // CR

                assert.equal(ts.fetch_line(), "abcd");
                assert.equal(ts.position, 12);

                assert.equal(ts.fetch_line(), "defg");
                assert.equal(ts.position, 22);

                assert.equal(ts.fetch_line(), "");
                assert.equal(ts.position, 24);


            });
        });
    });

    describe("#fetch_all", () => {

        it("should fetch all chars from pos to EOB (end-of-buffer)", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.put("abcd");
            ts.position = 0;
            assert.equal(ts.fetch_all(), "abcd");
            assert.equal(ts.position, 10);

        });

        it("should fetch all chars from pos to EOB (when pos != 0)", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.put("abcdef");
            ts.position = 6;

            assert.equal(ts.fetch_all(), "cdef");
            assert.equal(ts.position, 14);

        });

        it("should return an empty string if the buffer is empty", () => {

            let ts = new TextStream(context);
            ts.open();
            assert.equal(ts.fetch_all(), "");
            assert.equal(ts.position, 0);


        });
    });

    describe("#skipline", () => {

        describe("when the charset is ASCII", () => {

            it("should default to CRLF without changing LineSep (default)", () => {

                let ts = new TextStream(context);
                ts.open();
                ts.charset = "ASCII";

                ts.type = 2;

                ts.put("abc\r\ndef\r\nghi");

                ts.position = 0;
                ts.skipline();

                assert.equal(ts.position, 5);

            });


            it("should continue skipping lines until there are no more left to skip", () => {

                let ts = new TextStream(context);
                ts.open();
                ts.charset = "ASCII";

                ts.type = 2;
                ts.put("abc\r\ndef\r\nghi\r\n");

                ts.position = 0;

                ts.skipline();
                assert.equal(ts.position, 5);

                ts.skipline();
                assert.equal(ts.position, 10);

                ts.skipline();
                assert.equal(ts.position, 15);

                ts.skipline();
                ts.skipline();
                ts.skipline();
                ts.skipline();
                assert.equal(ts.position, 15);


            });

            it("should read up to LF if set", () => {

                let ts = new TextStream(context);
                ts.open();
                ts.charset = "ASCII";

                ts.type = 2;
                ts.put("abc\ndef");
                ts.position = 0;
                ts.skipline(10); // 10 = enum value for LF
                assert.equal(ts.position, 4);

            });

            it("should read up to CR if CR is linesep", () => {

                let ts = new TextStream(context);
                ts.open();
                ts.charset = "ASCII";

                ts.put("abc\rdef");
                ts.position = 0;
                ts.skipline(13);
                assert.equal(ts.position, 4);

            });
        });

        describe("when the charset is Unicode", () => {

            it("should default to CRLF without changing LineSep (default)", () => {

                let ts = new TextStream(context);
                ts.open();
                ts.type = 2;

                ts.put("abc\r\ndef\r\nghi");

                ts.position = 0;
                ts.skipline();

                assert.equal(ts.position, 12);

            });


            it("should continue skipping lines until there are no more left to skip", () => {

                let ts = new TextStream(context);
                ts.open();
                ts.type = 2;
                ts.put("abc\r\ndef\r\nghi\r\n");

                ts.position = 0;

                ts.skipline();
                assert.equal(ts.position, 12);

                ts.skipline();
                assert.equal(ts.position, 22);

                ts.skipline();
                assert.equal(ts.position, 32);

                ts.skipline();
                ts.skipline();
                ts.skipline();
                ts.skipline();
                assert.equal(ts.position, 32);


            });

            it("should read up to LF if set", () => {

                let ts = new TextStream(context);
                ts.open();
                ts.type = 2;
                ts.put("abc\ndef");
                ts.position = 0;
                ts.skipline(10); // 10 = enum value for LF
                assert.equal(ts.position, 10);

            });

            it("should read up to CR if CR is linesep", () => {

                let ts = new TextStream(context);
                ts.open();
                ts.put("abc\rdef");
                ts.position = 0;
                ts.skipline(13);
                assert.equal(ts.position, 10);

            });
        });
    });

    describe(".state", () => {

        it("should return 1 when stream is open", () => {

            let ts = new TextStream(context);
            ts.open();

            assert.equal(ts.state, 1);

        });

        it("should return 0 when stream is closed", () => {

            let ts = new TextStream(context);

            assert.equal(ts.state, 0);

            ts.open();

            assert.equal(ts.state, 1);

            ts.close();
            assert.equal(ts.state, 0);


        });
    });

    describe(".charset", () => {

        it("should be 'Unicode' by default", () => {

            let ts = new TextStream(context);
            ts.open();

            assert.equal(ts.charset, "Unicode");

        });

        it("should throw if the given charset value is unknown", () => {

            let ts = new TextStream(context);

            assert.throws(() => ts.charset = "unknown");
            assert.throws(() => ts.charset = "windows-1252");
            assert.throws(() => ts.charset = "utf-7");

            assert.doesNotThrow(() => ts.charset = "Unicode");
            assert.doesNotThrow(() => ts.charset = "ASCII");


        });

        it("should retain the casing used for the charset", () => {

            let ts = new TextStream(context);
            ts.open();

            ts.charset = "AsCiI";
            assert.equal(ts.charset, "AsCiI");

            ts.charset = "UNICODE";
            assert.equal(ts.charset, "UNICODE");


        });


        it("should support the ASCII charset", () => {

            let ts = new TextStream(context);
            ts.charset = 'ascii';

            assert.equal(ts.charset, "ascii");

        });

        it("should throw if trying to change '.charset' when position is not zero", () => {

            let ts = new TextStream(context);
            ts.open();

            ts.charset = "ASCII";
            ts.put(Buffer.from("abcd", "ascii"));

            assert.equal(ts.position, 4);

            assert.throws(() => ts.charset = "Unicode");


        });

        it("should allow the charset to be changed when the stream is closed", () => {

            let ts = new TextStream(context);
            ts.charset = "ASCII";
            ts.open();
            ts.put("abcd");
            assert.equal(ts.size, 4);

            ts.close();

            assert.doesNotThrow(() => ts.charset = "Unicode");


        });

        it("should reset position back to zero when '#close()' is called", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.put("abcd");

            assert.equal(ts.position, 10);

            ts.close();
            ts.open();

            assert.equal(ts.position, 0);


        });

        it("should throw if trying to change charcode when position is not zero", () => {

            let ts = new TextStream(context);

            ts.open();
            ts.put("abcd");

            assert.throws(() => ts.charset = "ascii");

        });

        it("should not alter position when changing charcode", () => {

            let ts = new TextStream(context);

            ts.open();
            ts.put("abcd");

            ts.position = 0;
            ts.charset = "ASCII";

            assert.equal(ts.position, 0);

        });

        it("should correctly report the size of a Unicode string", () => {

            let ts = new TextStream(context);

            ts.open();
            ts.charset = "unicode";

            ts.put("abcd");

            assert.equal(ts.size, 10);

        });

        it("should correctly handle converting from Unicode (UTF16LE) to ASCII (Windows-1252) charset", () => {

            let ts = new TextStream(context);

            ts.open();
            ts.charset = "unicode";

            ts.put("abcd");
            assert.equal(ts.size, 10);

            ts.position = 0;
            ts.charset = "ascii";

            assert.equal(ts.size, 10);

            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0xFF); // BOM
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0xFE); // BOM
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0x61); // ASCII 'a'
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0x00);
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0x62); // ASCII 'b'
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0x00);
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0x63); // ASCII 'c'
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0x00);
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0x64); // ASCII 'd'
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0x00);


        });

        it("should correctly handle changing between ASCII (Windows-1252) -> Unicode (UTF16LE) charsets", () => {

            let ts  = new TextStream(context);

            ts.open();
            ts.charset = 'ascii';
            ts.put(Buffer.from("abcd"));

            // The stream is ASCII.
            assert.equal(ts.size, 4);

            ts.position = 0;
            assert.deepEqual(ts.fetch_all(), "abcd");

            ts.position = 0;
            assert.equal(ts.fetch_n_chars(1), "a");
            assert.equal(ts.fetch_n_chars(1), "b");
            assert.equal(ts.fetch_n_chars(1), "c");
            assert.equal(ts.fetch_n_chars(1), "d");

            ts.position = 0;
            ts.charset = 'unicode';
            assert.equal(ts.size, 4);

            assert.equal(ts.position, 0);
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0x6261);
            assert.equal(ts.fetch_n_chars(1).charCodeAt(0), 0x6463);


        });
    });

    describe(".position", () => {

        it("should overwrite chars when position is changed", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.put("abcd");
            ts.position = 4;
            ts.put("123456");

            ts.position = 0;
            assert.equal(ts.fetch_all(), "a123456");
            assert.equal(ts.position, 16);

        });

        it("should throw when .position is called on an unopened stream", () => {

            let ts = new TextStream(context);
            assert.throws(function () { ts.position; });

        });

        it("should report a position of zero when stream is open but not written to.", () => {

            let ts = new TextStream(context);
            ts.open();
            assert(ts.position === 0, "Position is zero when not written to.");

        });

        it("should not advance position when empty strings are written.", () => {

            let ts = new TextStream(context);
            ts.open();
            assert(ts.position === 0, "Position is zero when stream is not written to.");

            ts.put("");
            assert.equal(ts.position, 2, "Position has the BOM encoding added when a blank string is written.");

            ts.put("");
            assert.equal(ts.position, 2, "Position remains at zero when another blank string is written.");


        });

        it("should advance 'position' by 2 bytes for a single char written to the stream.", () => {

            let ts = new TextStream(context);
            ts.open();

            assert.equal(ts.position, 0, "Position is 0");

            ts.put("a");
            assert.equal(ts.position, 4, "Position is 4");

            ts.put("b");
            assert.equal(ts.position, 6, "Position is now 6");

            ts.put("cdef");
            assert.equal(ts.position, 14, "Position is now 12");

            ts.position = 0;
            assert.equal(ts.fetch_all(), "abcdef");


        });

        it("should throw if position is set higher than string len", () => {

            let ts = new TextStream(context);
            ts.open();

            ts.put("abc");

            assert.equal(ts.position, 8);
            assert.doesNotThrow(() => ts.position = 6);
            assert.throws(() => ts.position = 9);


        });

        it("should put in to the correct position when position is changed", () => {

            let ts = new TextStream(context);
            ts.open();

            ts.put("abcd");
            assert.equal(ts.position, 10, `Expected ts.position is: ${ts.position}, expected 10`);

            ts.position = 2;
            ts.put("efgh");
            assert.equal(ts.position, 10);

            ts.position = 0;
            assert.equal(ts.position, 0);

            ts.put("blah");
            assert.equal(ts.position, 10);


        });
    });

    describe(".size", () => {

        it("should throw when size is requested on an unopened stream", () => {
            let ts = new TextStream(context);
            assert.throws(function () { ts.size(); });

        });

        it("should report the size as zero for an open but not written-to stream", () => {

            let ts = new TextStream(context);
            ts.open();
            assert.equal(ts.size, 0, "size is zero");

        });

        it("should report the size as zero for an empty string written to the stream", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.put("");
            assert.equal(ts.size, 2, "Size is equal to 2 for empty string");

        });

        it("should report the size correctly for UTF16LE strings (including BOM)", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.put("abc");
            assert.equal(ts.size, 8);

        });
    });

    describe("#copy_to", () => {

        it("should copy from one stream to another", () => {

            let srcstream = new TextStream(context);
            srcstream.open();
            srcstream.put("abc");
            srcstream.position = 0;

            let deststream = new TextStream(context);
            deststream.open();
            deststream.put("xyz");

            srcstream.copy_to(deststream);

            deststream.position = 0;
            assert.equal(deststream.fetch_all(), "xyzabc");

        });

        it("should copy from one stream to another when src stream's pos isn't EOS", () => {

            let srcstream = new TextStream(context);
            srcstream.open();
            srcstream.put("abc");
            srcstream.position = 4;

            let deststream = new TextStream(context);
            deststream.open();
            deststream.put("xyz");

            srcstream.copy_to(deststream);

            deststream.position = 0;
            assert.equal(deststream.fetch_all(), "xyzbc");

        });
    });

    describe("#savetofile", () => {

        it("should save to a file when the stream is open", () => {

            let ts = new TextStream(context);

            ts.open();
            ts.put("abcdef");

            const save_file_path = "C:\\hello.txt";
            ts.save_to_file(save_file_path);
            assert.deepEqual(
                context.vfs.ReadFileContents(save_file_path),
                Buffer.from(iconv.encode("abcdef", "utf16le", { addBOM: true }))
            );
        });

        it("should throw when attempting to save a file when the stream is not open", () => {

            let ts = new TextStream(context);

            ts.open();
            ts.put("abcdef");
            ts.close();

            const save_file_path = "C:\\hello.txt";

            assert.throws(function () { ts.save_to_file(save_file_path); });
        });

        it("should write an empty buffer to the file system if the buffer is empty or null", () => {

            let ts = new TextStream(context);

            ts.open();
            const save_file_path = "C:\\hello.txt";

            ts.save_to_file(save_file_path);

            assert.deepEqual(
                context.vfs.ReadFileContents(save_file_path),
                Buffer.alloc(0)
            );
        });

        it("should save the BOM if the buffer contains only the empty string", () => {

            let ts = new TextStream(context);

            ts.open();
            ts.put("");

            const save_file_path = "C:\\bom-only.txt";

            ts.save_to_file(save_file_path);

            assert.deepEqual(
                context.vfs.ReadFileContents(save_file_path),
                Buffer.from([0xFF, 0xFE]) // UTF-16LE Byte-Order-Mark (BOM)
            );
        });

        it("should save the BOM + str to a file", () => {

            let ts = new TextStream(context);

            ts.open();
            ts.put("abcdef");

            const save_file_path = "C:\\bom-only.txt";

            ts.save_to_file(save_file_path);

            assert.deepEqual(
                context.vfs.ReadFileContents(save_file_path),
                Buffer.from(iconv.encode("abcdef", "utf16le", { addBOM: true }))
            );
        });

        it("should set position to 0 after a successful write", () => {

            let ts = new TextStream(context);

            ts.open();
            ts.put("abcd");
            const save_file_path = "C:\\hello.txt";

            assert.equal(ts.position, 10);
            ts.save_to_file(save_file_path);
            assert.equal(ts.position, 0);
        });

    });

    describe("#load_from_file", () => {

        it("should load from a file, if that file exists", () => {

            let ts = new TextStream(context);

            const file_path = "C:\\foo\\bar.txt";

            context.vfs.AddFile(file_path, Buffer.from("abcd")); // ASCII file (no BOM), stream charset is Unicode.

            ts.open();
            ts.load_from_file(file_path);

            assert.equal(ts.position, 0);
            assert.equal(ts.size, 6);


        });

        it("should throw if the file does not exist", () => {

            let ts = new TextStream(context);

            context.vfs.AddFile("C:\\foo\\bar.txt", "abcd");

            ts.open();
            const file_path = "C:\\foo.txt";

            assert.throws(() => ts.load_from_file(file_path));
        });
    });

    describe("#to_binary_stream", () => {

        it("should return a copy as a binary stream", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.put("abcd");
            ts.position = 0;

            assert.equal(ts.size, 10);

            let bs = ts.to_binary_stream();

            assert.equal(bs.type, 1);
            assert.equal(bs.size, 10);

            bs.position = 0;
            assert.deepEqual(
                bs.fetch_all(),
                Buffer.from([0xFF, 0xFE, 0x61, 0x00, 0x62, 0x00, 0x63, 0x00, 0x64, 0x00])
            );


        });

        it("should return a copy as a binary stream, copying across position", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.put("Hello, world!");
            ts.position = 5

            assert.equal(ts.size, 28);

            let bs = ts.to_binary_stream();

            assert.equal(bs.type, 1);
            assert.equal(bs.size, 28);
            assert.equal(bs.position, 5);


        });

        it("should return a copy as a binary stream, copying across open/closed status", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.put("Hello, world!");

            assert.equal(ts.size, 28);
            assert.equal(ts.position, 28);

            ts.close();
            let bs = ts.to_binary_stream();

            assert.equal(bs.type, 1);
            assert.equal(bs.is_closed, true);


        });
    });

    describe("#pos_lookahead_matches", () => {

        it("should return True if lookahead matches", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.charset = "ASCII";
            ts.put("Hello, World!");
            ts.position = 0;

            assert.isTrue(ts.pos_lookahead_matches(Buffer.from("Hello")));


        });

        it("should return False is incoming buf is empty", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.charset = "ASCII";
            ts.put("Hello, World!");
            ts.position = 0;

            assert.isFalse(ts.pos_lookahead_matches(Buffer.alloc(0)));

        });

        it("should return False if pos is already at the end of the stream", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.charset = "ASCII";
            ts.put("Hello, World!");

            assert.isFalse(ts.pos_lookahead_matches(Buffer.from("hello")));

        });
    });

    describe("#column", () => {

        it("should return '1' when pos is '0' (column numbering starts at 1)", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.charset = "ASCII";
            ts.put("abcd");
            ts.position = 0;

            assert.equal(ts.column(), 1);


        });

        it("should correctly return columns using the default linesep", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.charset = "ASCII";

            let str = "aaaa\r\nbbbb\r\n";

            ts.put(str);
            ts.position = 0;

            var chars = ts.fetch_n_chars(4);

            assert.equal(chars, "aaaa");
            assert.equal(ts.position, 4);

            // POS | 0 | 1 | 2 | 3 |  4 |  5 | 6 | 7 | 8 |
            //     |---|---|---|---|----|----|---|---|---|
            // CHR | a | a | a | a | CR | LF | b | b | b |
            //     |---|---|---|---|----|----|---|---|---|
            // COL | 1 | 2 | 3 | 4 |  5 |  6 | 1 | 2 | 3 |
            //     |   |   |   |   | __ |    | * |   |   |
            //                       /
            //                      /
            //               pos is now here...
            assert.equal(ts.column(), 5);

            // See diagram above ... we start at POSITION(6)...
            let asserts = [
                { pos:  6, col: 1, chr: "b"  },
                { pos:  7, col: 2, chr: "b"  },
                { pos:  8, col: 3, chr: "b"  },
                { pos:  9, col: 4, chr: "b"  },
                { pos: 10, col: 5, chr: "\r" },
                { pos: 11, col: 6, chr: "\n" }
            ];

            asserts.forEach((a) => {
                ts.position = a.pos;
                assert.equal(ts.position, a.pos);
                assert.equal(ts.column(), a.col);
                assert.equal(ts.fetch_n_chars(1), a.chr);
            });


        });
    });

    describe("#line", () => {

        it("should return line 1 when the stream is empty", () => {

            let ts = new TextStream(context);
            ts.open();

            assert.equal(ts.line(), 1);

        });

        it("should return the current line number correctly", () => {

            let ts = new TextStream(context);
            ts.open();
            ts.charset = "ASCII";

            ts.put("aaaa\r\nbbbb\r\n");
            ts.position = 0;

            assert.equal(ts.position, 0);

            assert.equal(ts.line(), 1);

            ts.skipline();
            assert.equal(ts.line(), 2);

            ts.skipline();
            assert.equal(ts.line(), 3);


        });
    });

    describe("#skip_n_chars", () => {

        it("should successfully skip the correct number of ASCII characters", () => {

            let ts = new TextStream(context);

            ts.charset = "ASCII";
            ts.open();
            ts.put("aaaabbbbccccdddd");
            ts.position = 0;

            ts.skip_n_chars(4);
            assert.equal(ts.fetch_n_chars(4), "bbbb");

            ts.skip_n_chars(4);
            assert.equal(ts.fetch_n_chars(4), "dddd");


        });

        it("should successfully skip the correct number of UTF-16 characters", () => {

            let ts = new TextStream(context);

            ts.open();
            ts.put("aaaabbbbccccdddd");
            ts.position = 2; // BOM for UTF-16 streams

            ts.skip_n_chars(4);
            assert.equal(ts.fetch_n_chars(4), "bbbb");

            ts.skip_n_chars(4);
            assert.equal(ts.fetch_n_chars(4), "dddd");


        });

        it("should throw if a skip is attempted beyond the bounds of the stream", () => {

            let ts = new TextStream(context);
            const content = "aaaabbbbccccdddd";

            ts.charset = "ASCII";
            ts.open();
            ts.put(content);
            ts.position = 0;

            assert.doesNotThrow(() => ts.skip_n_chars(16));
            assert.throws(() => ts.skip_n_chars(1), "Cannot skip beyond buffer length");



        });
    });
});
