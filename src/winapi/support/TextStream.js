// This file is a backer for the ADODBStream object, which can be
// either a binary or textual stream (but not both).

class TextStream {

    constructor () {

        this.buffer         = null;
        this.pos            = 0;
        this.stream_is_open = false;
        this.linesep        = Buffer.from("\r\n", "utf16le");


        // https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/streamwriteenum
        this.STREAM_WRITE_ENUM = {
            WriteChar: 0, // DEFAULT, writes a string to (as-is) to the buffer.
            WriteLine: 1  // Writes `concat(string, LINE_SEP)' to the buffer.
        };

        this.STREAM_READ_ENUM = {
            ReadAll: -1,
            ReadLine: -2
        };

        // https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/lineseparatorsenum
        this.LINE_SEPARATOR_ENUM = {
            CR:   13, // Carriage return
            CRLF: -1, // Default. Carriage return + line feed.
            LF:   10  // Line feed.
        };

    }

    get EOS () {
        if (!this.buffer) return false;
        if (this.buffer.byteLength === this.pos) return true;
        return false;
    }

    set position (p) {

        if (p > this.buffer.byteLength) {
            throw new Error("Position cannot be set to " +
                            "an index beyond the bounds of "+
                            "the internal buffer.");
        }

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

    getsep (type) {

        if (type === undefined || type === null) {
            type = this.linesep;
        }

        var read_until_sep;

        switch (type) {
        case this.LINE_SEPARATOR_ENUM.CR:
            read_until_sep = Buffer.from("\r", "utf16le");
            break;
        case this.LINE_SEPARATOR_ENUM.LF:
            read_until_sep = Buffer.from("\n", "utf16le");
            break;

        case this.LINE_SEPARATOR_ENUM.CR:
        default:
            read_until_sep = Buffer.from("\r\n", "utf16le");
            break;
        }

        return read_until_sep;
    }


    skipline (line_sep_val) {

        let read_until_sep = this.getsep(line_sep_val),
            index_of_next_line = this.buffer.indexOf(read_until_sep, this.pos);

        if (index_of_next_line === -1) {
            index_of_next_line = this.buffer.byteLength;
        }
        else {
            index_of_next_line += read_until_sep.byteLength;
        }

        this.pos = index_of_next_line;
    }


    fetch_upto (sep) {

    }

    fetch_all () {

        let num_bytes_to_read = (this.buffer.byteLength - this.pos),
            outbuf = Buffer.alloc(num_bytes_to_read);
        this.buffer.copy(outbuf, 0, this.pos);
        return outbuf.toString("utf16le");
    }

    fetch_n_chars (n_chars) {

    }


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
