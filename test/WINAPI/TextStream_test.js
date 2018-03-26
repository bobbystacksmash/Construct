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

        it("Should add \r\n when options == 1.", (done) => {

            let ts = new TextStream();
            ts.open();

            ts.put("", 1);
            assert.equal(ts.size, 4);

            ts.put("abc", 1);
            assert.equal(ts.size, 14);

            done();
        });



    });

    describe(".position", () => {

        it("Should throw when .position is called on an unopened stream.", (done) => {

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

        it("Should advance 'position' by two bytes for a single char written to the stream.", (done) => {

            let ts = new TextStream();
            ts.open();

            ts.put("a");
            assert(ts.position === 2, "Position is 2");

            ts.put("b");
            assert(ts.position === 4, "Position is now 4");

            ts.put("cdef");
            assert(ts.position === 12, "Position is now 12");

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
