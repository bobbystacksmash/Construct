const Stream       = require("./Stream");
const iconv = require("iconv-lite");

class TextStream extends Stream {

    constructor (context) {

        super(context);

        this.pos            = 0;
        this.stream_is_open = false;
        this.linesep        = Buffer.from("\r\n", "utf16le");
        this.encoding       = Buffer.from([0xFF, 0xFE]);

        this.has_encoding_bytes = false;

        // https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/streamwriteenum
        this.STREAM_WRITE_ENUM = {
            WriteChar: 0, // DEFAULT, writes a string to (as-is) to the buffer.
            WriteLine: 1  // Writes `concat(string, LINE_SEP)' to the buffer.
        };

        this.STREAM_READ_ENUM = {
            ReadAll: -1,
            ReadLine: -2
        };

        this.CHARSETS = {
            "unicode" : { encoding: "utf16le",      bytes_width: 2 },
            "ascii"   : { encoding: "windows-1252", bytes_width: 1 },
        };

        // https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/lineseparatorsenum
        this.LINE_SEPARATOR_ENUM = {
            CR:   13, // Carriage return
            CRLF: -1, // Default. Carriage return + line feed.
            LF:   10  // Line feed.
        };

        this._charset_name = "Unicode";
        this._charset = this.CHARSETS.unicode;

    }

    get charset () {
        return this._charset_name;
    }
    set charset (charset) {

        if (this.pos !== 0) {
            /*
             name Error
             number -2146825069
             description Operation is not allowed in this context.
             message Operation is not allowed in this context.
            */
            throw new Error("Cannot change charset when position is not zero");
        }

        if (Object.keys(this.CHARSETS).includes(charset.toLowerCase())) {
            this._charset_name = charset;
            this._charset = this.CHARSETS[charset.toLowerCase()];
        }

        // TODO throw if charset is unknown...
    }

    get type () {
        return 2;
    }

    set separator (opt) {

        if (opt !== this.LINE_SEPARATOR_ENUM.CR &&
            opt !== this.LINE_SEPARATOR_ENUM.CRLF &&
            opt !== this.LINE_SEPARATOR_ENUM.LF) {
            throw new Error(`Line separator value "${opt}" is not recognised.`);
        }

        this.linesep = this.getsep(opt);
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

        if (this.pos === 0) {
            this.pos = 2;
        }

        if (! this.buffer || this.buffer.byteLength === 0 || this.pos === this.buffer.byteLength) {
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

        if (this.buffer.byteLength === 0) {
            return 0;
        }

        // TODO - fix this...
        /*if (this.pos === 0) {
            this.pos = 2;
        }*/

        return iconv.decode(this._fetch_all(), this._charset.encoding);
    }


    fetch_n_chars (n_chars) {

        let buf = this._fetch_n_bytes(n_chars * this._charset.bytes_width);

        return iconv.decode(buf, this._charset.encoding);
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

        options = options || {};

        if (!this.stream_is_open) {
            throw new Error("Stream is not open for writing.");
        }

        if (typeof data === "string") {
            data = Buffer.from(data);
        }

        // Ignore current buffer contents for now...
        this.buffer = iconv.encode(data, this._charset.encoding, { addBOM: true });

        // Will cause tests to fail during integration period...
        this.pos = this.buffer.byteLength;

        // Sizes of Text Streams contain an additional 2 bytes:
        //
        //   https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/loadfromfile-method-ado
        //
        // > Because 2 bytes may be added to the beginning of the
        // > stream for encoding, the size of the stream may not
        // > exactly match the size of the file from which it was
        // > loaded.

        /*let data_buf = (this.has_encoding_bytes === false)
            ? Buffer.from(iconv.encode(data, "utf16le", { addBOM: true }))
            : Buffer.from(data, "utf16le");

        if (this.has_encoding_bytes === false) {
            this.has_encoding_bytes = true;
        }

        if (this.has_encoding_bytes && this.pos === 0) {
            this.pos = 2;
        }

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
        this.pos    = this.buffer.byteLength;*/
    }

    copy_to (dest_stream, num_chars) {

        var stream_contents;

        if (num_chars === undefined || num_chars === null || num_chars === -1) {
            stream_contents = this.fetch_all();
        }
        else {
            stream_contents = this.fetch_n_chars(num_chars);
        }

        dest_stream.put(stream_contents);
    }

    load_from_file (path) {

        let file_contents    = this._load_from_file(path);

        this.buffer = Buffer.concat([this.encoding, Buffer.from(iconv.encode(file_contents, "ascii"))]);

        this.pos = 0;

    }

    to_binary_stream () {

        const BinaryStream = require("./BinaryStream");

        let bs = new BinaryStream(this.context);

        bs.open();
        bs.put(this.buffer);
        bs.position = this.pos; // TODO: int division?

        if (this.stream_is_open) {
            bs.open();
        }
        else {
            bs.close();
        }

        return bs;
    }
}

module.exports = TextStream;
