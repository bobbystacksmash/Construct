const SupportTextStream = require("./TextStream");

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

    constructor (context, filespec, can_read, write_mode, encoding) {

        this.WRITE_MODE_ENUM = {
            CANNOT_WRITE: 0, // Writing is forbidden.
            CAN_WRITE:    1, // File PTR is placed at pos 0.
            APPEND_ONLY:  2  // File PTR is positioned at EOS, cannot move further back.
        };

        if (can_read   === undefined || can_read   === null) can_read  = true;
        if (write_mode === undefined || write_mode === null) write_mode = 0;

        if (write_mode !== this.WRITE_MODE_ENUM.CANNOT_WRITE &&
            write_mode !== this.WRITE_MODE_ENUM.CAN_WRITE &&
            write_mode !== this.WRITE_MODE_ENUM.APPEND_ONLY) {
            throw new Error("Unknown write mode:", write_mode);
        }

        this.stream = new SupportTextStream(context);

        this.backed_by  = filespec;
        this.can_read   = can_read;
        this.write_mode = write_mode;
        this.encoding   = encoding;

        this.stream         = new SupportTextStream(context);
        this.stream.charset = encoding;
        this.stream.open();

        // Let's load the contents of `filepath' in to our stream:
        //
        // TODO: Look at 'filespec' and add in Std{In,Out,Err} stuff here...
        //

        if (context.vfs.GetFile(filespec) === false) {
            context.vfs.AddFile(filespec);
        }

        this.stream.load_from_file(filespec);
    }

    //
    // PROPERTIES
    // ==========

    // Returns True if the end-of-a-line marker has been reached, or
    // False if not.
    get AtEndOfLine () {
        let stream_eol_sep = this.stream.getsep();
        return this.stream.pos_lookahead_matches(stream_eol_sep);
    }

    // Returns True if the end of a stream has been reached, or False
    // if not.
    get AtEndOfStream () {
        return this.stream.is_pos_EOS();
    }

    // Returns the current column number of the current character
    // position within the stream.
    get Column ( ) {
        return this.stream.column();
    }

    // Read-only property that returns the current line number in a
    // TextStream file.
    get Line ( ) {
        return this.stream.line();
    }

    get LineSeparator () {
        return this.stream.getsep();
    }

    //
    // Utility Methods
    // ===============
    _throw_if_read_forbidden () {
        if (this.can_read === false) {
            throw new Error("Reading is forbidden");
        }
    }

    _throw_if_write_forbidden () {

        // TODO: IF IN APPEND-ONLY MODE
        //         DO NOT ALLOW A WRITE BEFORE EOS POS

        if (this.write_mode === this.WRITE_MODE_ENUM.CANNOT_WRITE) {
            throw new Error("Writing is forbidden");
        }
    }

    //
    // WIN METHODS
    // ===========

    // Closes the stream.
    Close () {
        this.stream.close();
    }

    // Reads a specified number of characters from a TextStream file
    // and returns the resulting string.
    Read (n_chars) {

        this._throw_if_read_forbidden();

        if (this.stream.is_pos_EOS() && this.stream.position > 0) {
            throw new Error("At EOS");
        }

        let read_str = this.stream.fetch_n_chars(n_chars);

        if (read_str === 0) {
            throw new Error("Cannot call Read on an empty file");
        }

        return read_str;
    }

    // Reads an entire TextStream file and returns the resulting
    // string.
    ReadAll () {

        this._throw_if_read_forbidden();

        if (this.stream.is_pos_EOS() && this.stream.position > 0) {
            throw new Error("At EOS");
        }

        let file_contents = this.stream.fetch_all();

        if (file_contents === 0) {
            throw new Error("Cannot call ReadAll on an empty file");
        }

        return file_contents;
    }

    // Reads an entire line (up to, but not including, the newline
    // character) from a TextStream file and returns the resulting
    // string.
    ReadLine () {

        this._throw_if_read_forbidden();

        if (this.stream.is_pos_EOS() && this.stream.position > 0) {
            throw new Error("At EOS");
        }
        else if (this.stream.size === 0) {
            throw new Error("Cannot call ReadLine on an empty file");
        }

        let line = this.stream.fetch_line();

        return line;
    }

    // Skips a specified number of characters when reading a
    // TextStream file.
    Skip (n_chars) {

        this._throw_if_read_forbidden();

        this.stream.skip_n_chars(n_chars);
    }

    // Skips the next line when reading a TextStream file.
    SkipLine () {

        this._throw_if_read_forbidden();

        // All we do do skip a line is to read a line and not return
        // the line.
        try {
            this.ReadLine();
        }
        catch (e) {
            if (e.message.includes("ReadLine on an empty file")) {
                throw new Error("Cannot call SkipLine on an empty file");
            }

            throw e;
        }
    }

    // Writes a specified string to a TextStream file.
    Write (msg, append_this) {

        this._throw_if_write_forbidden();

        if (typeof msg == "number") {
            msg = "" + msg;
        }
        else if (msg instanceof Array) {
            msg = msg.join("");
        }
        else if (typeof msg === "object") {
            msg = msg.toString();
        }



        if (this.write_mode === this.WRITE_MODE_ENUM.APPEND_ONLY) {
            msg = `${this.stream.fetch_all()}${msg}`;
            this.stream.position = 0;
        }

        if (append_this) {
            msg = `${msg}${append_this}`;
        }

        this.stream.put(msg);
        const pos = this.stream.position;

        // Other Stream implementations require that saving to the
        // file resets the positional counter.  This is not the case
        // for TextStreams used by the FSO, so we reset position to be
        // the EOS.

        const overwrite_if_exists = 2;
        this.stream.save_to_file(this.backed_by, overwrite_if_exists);
        this.stream.position = pos;
    }

    // Writes a specified number of newline characters to a TextStream
    // file.
    WriteBlankLines (num_lines_to_write) {

        this._throw_if_write_forbidden();

        try {
            const sep = this.stream.getsep();

            for (let i = 0; i < num_lines_to_write; i++) {
                this.Write(sep);
            }
        }
        catch (e) {
            throw e;
        }
    }

    // Writes a specified string and newline character to a TextStream
    // file.
    WriteLine (msg) {

        this._throw_if_write_forbidden();

        try {
            const sep = this.stream.getsep();
            this.Write(msg, sep);
        }
        catch (e) {
            throw e;
        }
    }

}

module.exports = AbstractIOStream;
