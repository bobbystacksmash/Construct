// This file is a backer for the ADODBStream object, which can be
// either a binary or textual stream (but not both).

class TextStream {

    constructor () {

        this.buffer         = null;
        this.pos            = 0;
        this.stream_is_open = false;

        // https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/streamwriteenum
        this.STREAM_WRITE_ENUM = {
            WriteChar: 0, // DEFAULT, writes a string to (as-is) to the buffer.
            WriteLine: 1  // Writes `concat(string, LINE_SEP)' to the buffer.
        };

        // https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/lineseparatorsenum
        this.LINE_SEPARATOR_ENUM = {
            CR:   13, // Carriage return
            CRLF: -1, // Default. Carriage return + line feed.
            LF:   10  // Line feed.
        };
    }

    set position (p) {
        this.pos = p;
    }
    get position () {

        if (!this.stream_is_open) {
            throw new Error("Position cannot be called when stream instance is closed.");
        }

        return this.pos;
    }

    get size () {

        if (!this.stream_is_open) {
            throw new Error("Size cannot be called when stream instance is closed.");
        }

        if (this.buffer === null ||  this.buffer.length === 0) return 0;

        return Buffer.byteLength(this.buffer, "utf16le");
    }

    open () {
        this.stream_is_open = true;
    }

    close () {
        this.stream_is_open = false;
    }


    // ReadText and WriteText are for text streams, while Read and
    // Write are for binary streams.  To simply the Stream API, both
    // BinaryStream and TextStream instances will use `put' and
    // `fetch' -- deliberately different from the ADODBStream API
    // names to avoid confusion.

    //
    // Put
    // ===
    //
    // SYNOPSIS
    // ========
    //
    // As this is a `TextStream', calling `put' will WRITE textual
    // data to this stream.
    //
    put (data, options) {

        if (!this.stream_is_open) {
            throw new Error("Stream is not open for writing.");
        }

        let data_buf = Buffer.from(data, "utf16le");

        if (options === this.STREAM_WRITE_ENUM.WriteLine) {
            data_buf = Buffer.concat([data_buf, Buffer.from("\r\n", "utf16le")]);
        }

        if (this.buffer === null) {
            this.buffer = data_buf;
            this.pos    = data_buf.byteLength;
            return;
        }

        let existing_buf_slice = this.buffer.slice(0, this.pos);
        this.buffer = Buffer.concat([existing_buf_slice, data_buf]);
        this.pos    = this.buffer.byteLength;
    }
}

module.exports = TextStream;
