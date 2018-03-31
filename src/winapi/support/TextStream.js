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

        if (p === 0) {
            this.pos = 0;
            return;
        }
        else if (! this.buffer || this.buffer === null || this.buffer === undefined) {
            throw new Error("Cannot set position to a positive value " +
                            "while the buffer is empty.");
        }

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

    set separator (opt) {

        if (opt !== this.LINE_SEPARATOR_ENUM.CR &&
            opt !== this.LINE_SEPARATOR_ENUM.CRLF &&
            opt !== this.LINE_SEPARATOR_ENUM.LF) {
            throw new Error(`Line separator value "${opt}" is not recognised.`);
        }

        this.linesep = this.getsep(opt);
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

        case this.LINE_SEPARATOR_ENUM.CRLF:
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


    fetch_line () {

        if (! this.buffer || this.buffer.byteLength === 0) {
            return "";
        }

        let sep_index  = this.buffer.indexOf(this.linesep, this.pos),
            outbuf_len = (this.pos === 0) ? sep_index : (sep_index - this.pos);

        if (sep_index === -1) {
            return this.fetch_all();
        }

        const outbuf = Buffer.alloc(outbuf_len);
        this.buffer.copy(outbuf, 0, this.pos, this.pos + outbuf_len);
        this.pos = (sep_index + this.linesep.byteLength);
        return outbuf.toString("utf16le");
    }

    fetch_all () {

        if (! this.buffer || this.buffer.byteLength === 0) {
            return "";
        }

        let num_bytes_to_read = (this.buffer.byteLength - this.pos),
            outbuf = Buffer.alloc(num_bytes_to_read);
        this.buffer.copy(outbuf, 0, this.pos);
        this.pos = this.buffer.byteLength;
        return outbuf.toString("utf16le");
    }

    fetch_n_chars (n_chars) {

        if (! this.buffer || this.buffer === null || this.buffer.byteLength === 0) {
            return "";
        }

        let num_bytes_to_read = (n_chars * 2);

        // If the n_chars to read is greater than the length
        // of the available buffer, we just read up to the
        // end of buffer.
        let num_bytes_available = (this.buffer.byteLength - this.pos),
            max_bytes_to_read   = Math.min(num_bytes_to_read, num_bytes_available),
            read_upto_index     = this.pos + num_bytes_to_read;

        if (read_upto_index > this.buffer.byteLength - 1) {
            read_upto_index = (this.buffer.byteLength - 1);
        }

        const outbuf = Buffer.alloc(Math.min(num_bytes_to_read, num_bytes_available));

        this.buffer.copy(outbuf, 0, this.pos, read_upto_index);
        this.pos += 2;
        return outbuf.toString("utf16le");
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
