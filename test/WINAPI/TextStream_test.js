const assert = require("chai").assert;
const TextStream = require("../../src/winapi/support/TextStream");
const VirtualFileSystem = require("../../src/runtime/virtfs");

// The TextStream most commonly represents a text file, however it can
// also represent any input/output stream, such as stdin or stdout.

var context = null;

const new_vfs = () => new VirtualFileSystem({ register: () => {} });

describe("TextStream", () => {

    // A TextStream can represent either a:
    //
    //   - text file
    //   - input/output stream (such as StdIn, StdOut, and StdErr).
    //

    beforeEach(() => {
        context = {
            epoch: 1234567890,
            emitter: { emit: () => {} },
            exceptions: {
            },
            vfs: {}
        };

        context.vfs = new_vfs();
    });


    describe("Properties", () => {

        describe(".AtEndOfLine", () => {

        });

        describe(".AtEndOfStream", () => {
        });

        describe(".Column", () => {
        });

        describe(".Line", () => {
        });
    });

    describe("Methods", () => {

        describe("#Close", () => {});
        describe("#Read", () => {});
        describe("#ReadAll", () => {});
        describe("#ReadLine", () => {});
        describe("#Skip", () => {});
        describe("#SkipLine", () => {});
        describe("#Write", () => {});
        describe("#WriteBlankLines", () => {});
        describe("#WriteLine", () => {});

    });
});
