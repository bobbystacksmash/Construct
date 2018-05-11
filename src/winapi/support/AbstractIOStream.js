
const SupportTextStream = require("./support/TextStream");

//
// Abstract Input/Output Stream
// ============================
//
// Unfortunately, there are two TextStreams within this project.
// There's the support TextStream, and the WINAPI TextStream.  The
// support version is intended to support the ADODB Stream's
// text-mode, while the WINAPI TextStream is the WINAPI TextStream
// which represents either a file or an IO stream.
//
// The purpose of this AbstractIOStream is to focus entirely upon the
// specifics of stream-to-file operations, suh as:
//
//   - closing a stream
//   - skipping lines
//   - writing to a stream
//   - etc.
//
// However, the AbstractIOStream does NOT attempt to match any of
// Window's expected behaviour (like detailed exception messages), nor
// does it support any kind of eventing.  Instead, all of these
// details are handled upstream by the WINAPI TextStream.
//
// Given that the support TextStream does provide much of the
// implementation detail we require for this class (such as file
// save/loading, and writing to a stream), the AbstractIOStream will
// make *heavy* use of this support class.
//
class AbstractIOStream {

    constructor (context) {
        this.stream = new TextStream(context);
    }

    //
    // PROPERTIES
    // ==========

    // Returns True if the end-of-a-line marker has been reached, or
    // False if not.
    get atendofline () {}

    // Read-Only - this throws.
    set atendofline (_) {}

    // Returns True if the end of a stream has been reached, or False
    // if not.
    get atendofstream ( ) {}

    // Read-Only - this throws.
    set atendofstream (_) {}

    // Returns the current column number of the current character
    // position within the stream.
    get column ( ) {}

    // Read-Only - this throws.
    set column (_) {}

    // Read-only property that returns the current line number in a
    // TextStream file.
    get line ( ) {}

    // Read-Only - this throws.
    set line (_) {}

    //
    // WIN METHODS
    // ===========

    // Closes the stream.
    close () {}

    // Reads a specified number of characters from a TextStream file
    // and returns the resulting string.
    read () {}

    // Reads an entire TextStream file and returns the resulting
    // string.
    readall () {}

    // Reads an entire line (up to, but not including, the newline
    // character) from a TextStream file and returns the resulting
    // string.
    readline () {}

    // Skips a specified number of characters when reading a
    // TextStream file.
    skip () {}

    // Skips the next line when reading a TextStream file.
    skipline () {}

    // Writes a specified string to a TextStream file.
    write () {}

    // Writes a specified number of newline characters to a TextStream
    // file.
    writeblanklines () {}

    // Writes a specified string and newline character to a TextStream
    // file.
    writeline () {}

    //
    // OVERRIDES
    // =========
    SerialiseToStream () {}
}
