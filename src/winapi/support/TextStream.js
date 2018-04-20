const Stream       = require("./Stream");
const iconv = require("iconv-lite");

class TextStream extends Stream {

    constructor (context) {

        super(context);

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
            "unicode" : { encoding: "utf16-le",      bytes_width: 2 },
            "ascii"   : { encoding: "windows-1252", bytes_width: 1 }
        };

        // https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/lineseparatorsenum
        this.LINE_SEPARATOR_ENUM = {
            CR:   13, // Carriage return
            CRLF: -1, // Default. Carriage return + line feed.
            LF:   10  // Line feed.
        };

        this.LINE_SEPARATORS = {
            CR:   "\r",
            CRLF: "\r\n",
            LF:   "\n"
        };

        this.pos            = 0;
        this.stream_is_open = false;
        this.linesep        = this.LINE_SEPARATOR_ENUM.CRLF;
        this.UTF16LE_BOM    = Buffer.from([0xFF, 0xFE]);
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
    _buffer_has_BOM (buf) {

        if (! buf || buf.byteLength <= 1) return false;
        return this.UTF16LE_BOM.equals(buf.slice(0, 2));
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

        this.linesep = opt;

        //this.linesep = this.getsep(opt);
    }


    getsep (type) {

        if (type === undefined || type === null) {
            type = this.linesep;
        }

        var read_until_sep;

        // TODO: Need to add linesep tests for the case where we have
        // ASCII CRLF sequences in unicode mode -- where does the
        // reader stop?

        switch (type) {
        case this.LINE_SEPARATOR_ENUM.CR:
            read_until_sep = Buffer.from("\r", "utf16-le");
            break;
        case this.LINE_SEPARATOR_ENUM.LF:
            read_until_sep = Buffer.from("\n", "utf16-le");
            break;

        case this.LINE_SEPARATOR_ENUM.CRLF:
        default:
            read_until_sep = Buffer.from("\r\n", "utf16-le");
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
        return outbuf.toString("utf16-le");
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
        // Windows will automatically advance the position when ALL of
        // the following conditions are true:
        let advance_pos = (this._buffer_has_BOM(this.buffer) &&
                           this._charset.encoding === "utf16-le" &&
                           this.buffer.byteLength >= 2 &&
                           this.position === 0);

        if (advance_pos) {
            this.pos = 2;
        }

        let buf = this._fetch_n_bytes(n_chars * this._charset.bytes_width);
        return iconv.decode(buf, this._charset.encoding);
    }


    _buf_has_BOM (buf) {

        if (!buf || buf.byteLength < 2) return false;

        return buf.slice(0, 2).equals(this.UTF16LE_BOM);
    }

    _stream_requires_BOM () {

        // Looks as though Windows only adds the Byte Order Mark (BOM)
        // under the following conditions:
        //
        //  - the stream's charset is "Unicode", and
        //  - the stream's size is zero.
        //
        // A good example test of this is adding an empty string ("")
        // to an ADODB.Stream in text mode (2):
        //
        //   var ado = new ActiveXObject("ADODB.Stream");
        //   ado.open();
        //   ado.type    = 2;
        //   ado.charset = "Unicode";
        //   WScript.Echo(ado.size, ado.position); // prints=> "0, 0"
        //   ado.WriteText("");
        //   WScript.Echo(ado.size, ado.position); // prints=> "2, 2".
        //
        let has_utf16_charset = this._charset.encoding === "utf16-le",
            has_empty_buffer  = this.buffer.byteLength === 0;

        return has_utf16_charset && has_empty_buffer;
    }


    put (data, options) {

        if (!this.stream_is_open) {
            throw new Error("Stream is not open for writing.");
        }

        if (typeof data === "string") {
            data = iconv.encode(
                data,
                this._charset.encoding, { addBOM: this._stream_requires_BOM() }
            );
        }

        if (this._charset.encoding === "utf16-le" && this.pos === 0 && this.buffer.byteLength >= 2) {
            this.pos = 2;
        }


        // Options handling
        // ================
        //
        // Only two options are supported, both are defined in the
        // `StreamWriteEnum' as:
        //
        // | Value | Description                                                        |
        // |-------|--------------------------------------------------------------------|
        // |   0   | Default. Writes the text specified by `data' in to the stream buf. |
        // |   1   | Writes `data' + the current `this.linesep' value.                  |
        //
        // The different line separators are defined in the
        // `LineSeparatorsEnum', with values:
        //
        // | Value | Description                                          |
        // |-------|------------------------------------------------------|
        // |  13   | Carriage return (CR).                                |
        // |  -1   | Default. Indicates carriage return line feed (CRLF). |
        // |  10   | Line feed (LF).                                      |
        //
        // https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/lineseparatorsenum?view=sql-server-2017
        //
        if (options === undefined || options === null) {
            options = 0; // Default - do not add a linesep.
        }

        if (options === 1) {

            var sep;

            // Calling-code indicates that it wants us to append a
            // line separator to `data'...
            if (this.linesep === this.LINE_SEPARATOR_ENUM.CR) {
                sep = this.LINE_SEPARATORS.CR;
            }
            else if (this.linesep === this.LINE_SEPARATOR_ENUM.LF) {
                sep = this.LINE_SEPARATORS.LF;
            }
            else if (this.linesep === this.LINE_SEPARATOR_ENUM.CRLF) {
                sep = this.LINE_SEPARATORS.CRLF;
            }

            data = Buffer.concat([data, iconv.encode(sep, this._charset.encoding)]);
        }
        else if (options !== 0) {
            throw new Error("Unknown option value to #put -- only '0' and '1' are allowed.");
        }

        this.put_buf(data);

        return;

        /*if (options === this.STREAM_WRITE_ENUM.WriteLine) {
            data = Buffer.concat([data, Buffer.from("\r\n")]);
         }*/

        /*let incoming_buf = iconv.encode(data, this._charset.encoding, { addBOM: true });

        if (!this.buffer || this.buffer.byteLength === 0) {

            this.buffer = incoming_buf;
            this.pos = this.buffer.byteLength;
            return;
        }*/

        /*let existing_buf_slice = this.buffer.slice(0, this.pos);
        this.buffer = Buffer.concat([existing_buf_slice, data]);
        this.pos    = this.buffer.byteLength;*/



        // TODO: need to figure out if BUF already contains the BOM,
        // and use 'addBom' depending upon it.  Behaviour of
        // iconv-lite means it won't add a BOM for ascii.

        /*console.log("position", this.pos);
        console.log("existing", this.buffer);
        console.log("incoming", incoming_buf);
        console.log("----");

        this.buffer = incoming_buf;

        // Will cause tests to fail during integration period...
        this.pos = this.buffer.byteLength;*/

        /*let data_buf = (this.has_encoding_bytes === false)
            ? Buffer.from(iconv.encode(data, "utf16-le", { addBOM: true }))
            : Buffer.from(data, "utf16-le");

        if (this.has_encoding_bytes === false) {
            this.has_encoding_bytes = true;
        }

        if (this.has_encoding_bytes && this.pos === 0) {
            this.pos = 2;
        }

        if (options === this.STREAM_WRITE_ENUM.WriteLine) {
            data_buf = Buffer.concat([data_buf, Buffer.from("\r\n", "utf16-le")]);
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
