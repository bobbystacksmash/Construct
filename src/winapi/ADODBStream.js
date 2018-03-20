const Component = require("../Component");
const proxify   = require("../proxify2");

/*
 * ============
 * ADODB Stream
 * ============
 *
 * Notes
 * =====
 *
 * A.D.O. =  Microsoft [A]ctiveX [D]ata [O]bjects.
 *
 * Represents a stream of binary data or text and provides methods and
 * properties to manage this binary data.
 *
 * https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/stream-object-ado
 * https://www.w3schools.com/asp/ado_ref_stream.asp
 *
 * API
 * ===
 *
 * https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/stream-object-properties-methods-and-events
 *
 * PROPERTIES
 * ==========
 *
 * [ ] - Charset       https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/charset-property-ado
 * [ ] - EOS           https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/eos-property
 * [ ] - LineSeparator https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/lineseparator-property-ado
 * [ ] - Mode          https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/mode-property-ado
 * [ ] - Position      https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/position-property-ado
 * [ ] - Size          https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/size-property-ado-stream
 * [ ] - State         https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/state-property-ado
 * [ ] - Type          https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/type-property-ado-stream
 *
 *
 * METHODS
 * =======
 *
 * [ ] - Cancel        https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/cancel-method-ado
 * [ ] - Close         https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/close-method-ado
 * [ ] - CopyTo        https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/copyto-method-ado
 * [ ] - Flush         https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/flush-method-ado
 * [ ] - LoadFromFile  https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/loadfromfile-method-ado
 * [ ] - Open          https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/open-method-ado-stream
 * [ ] - Read          https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/read-method
 * [ ] - SaveToFile    https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/savetofile-method
 * [ ] - SetEOS        https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/seteos-method
 * [ ] - SkipLine      https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/skipline-method
 * [ ] - Stat          https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/stat-method
 * [ ] - Write         https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/write-method
 * [ ] - WriteText     https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/writetext-method
 *
 */

class JS_ADODBStream extends Component {

    constructor (context) {
        super(context, "ADODBStream");
        this.ee  = this.context.emitter;
        this.vfs = this.context.vfs;


        // Open
        this.CONNECT_MODE_ENUM = {
            Unknown        : 0,
            Read           : 1,
            Write          : 2,
            ReadWrite      : 3,
            ShareDenyRead  : 4,
            ShareDenyWrite : 8,
            ShareExclusive : 12,
            ShareDenyNone  : 16,
            Recursive      : 0x400000
        };

        this.OPEN_OPTIONS_ENUM = {
            OpenStreamAsync: 1,
            OpenStreamFromRecord: 4,
            OpenStreamUnspecified: -1
        };

        this.STREAM_READ_ENUM = {
            ReadAll: -1, // Default. Reads all bytes from the stream,
                         // from the current position onwards to the
                         // EOS marker. This is the only valid
                         // StreamReadEnum value with binary streams
                         // (Type is adTypeBinary).
            ReadLine: -2 // Reads the next line from the stream
                         // (designated by the LineSeparator
                         // property).
        };


        // Stream-specific properties
        this.at_end_of_stream = false;
        this.eos_marker       = -1;
        this.pos              = 0;
        this.stream_is_open   = false;
        this.buffer           = null;
    }


    _update_buffer (newbuf) {

        this.buffer = new ArrayBuffer(512); // TODO: figure this bit out.
        this.buffer_view = new UInt8Array(this.buffer_view);


    }


    //
    // PROPERTIES
    // ==========
    //
    get charset () {

    }
    set charset (charset) {
        console.log("CHARSET:", arguments);
    }


    get lineseparator () {
        console.log("LINESEP!");
    }
    set lineseparator (lsep)  {
        console.log("SET LINE SEP!");
    }


    get mode () {

    }
    set mode (mode) {
        console.log("SET MODE:", arguments);

    }

    //
    // Size
    // ====
    //
    // MSDN: https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/size-property-ado-stream
    //
    // SYNOPSIS
    // ========
    //
    // Indicates the size of the stream in number of bytes.  Returns a
    // Long value that specifies the size of the stream in number of
    // bytes. The default value is the size of the stream, or -1 if
    // the size of the stream is not known.
    //
    get size () {

        if (! this.stream_is_open) {
            this.context.exceptions.throw_operation_not_allowed_when_closed(
                "ADODB.Stream",
                `A Stream's ".size" property was requested before the stream was open.`,
                `This exception has been thrown because calling code has attempted to ` +
                    `request an unopened Stream instance's ".size" property.`
            );
        }

        var buffer_size = 0;

        if (this.buffer === null) {
            buffer_size = 0;
        }
        else {
            buffer_size = this.buffer.length + 2;
        }

        this.ee.emit("@ADODBStream.size", buffer_size);
        return buffer_size;
    }



    //
    // Position
    // ========
    //
    // MSDN: https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/position-property-ado
    //
    // SYNOPSIS
    // ========
    //
    // Sets or returns a value that specifies the offset, in number of
    // bytes, of the current position from the beginning of the
    // stream. The default is 0, which represents the first byte in
    // the stream.
    //
    // The current position can be moved to a point after the end of
    // the stream. If you specify the current position beyond the end
    // of the stream, the Size of the Stream object will be increased
    // accordingly. Any new bytes added in this way will be null.
    //
    get position () {
        this.ee.emit("@ADODBStream.position (get)", this.pos);
        return this.pos;
    }
    set position (p) {
        this.ee.emit("@ADODBStream.position (set)", p);

        if (p > this.buffer.length) {
            let delta = p - this.buffer.length;
            this.buffer = Buffer.concat([this.buffer, Buffer.alloc(delta, 0x00)]);
        }

        this.pos = p;
    }


    //
    // METHODS
    // =======
    //

    //
    // Cancel
    // ======
    //
    // MSDN: https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/cancel-method-ado
    //
    // SYNOPSIS
    // ========
    //
    // Cancels execution of a pending asynchronous method call.
    //
    cancel () {
        this.ee.emit("@ADODBStream::Cancel()", arguments);
    }


    //
    // Close
    // =====
    //
    // MSDN: https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/close-method-ado
    //
    // SYNOPSIS
    // ========
    //
    // Closes an open object and any dependent objects.
    //
    close () {
        this.ee.emit("@ADODBStream::Close", arguments);
        this.stream_is_open = false;
    }

    //
    // CopyTo
    // ======
    //
    // SYNOPSIS
    // ========
    //
    // Copies the specified number of characters or bytes (depending
    // on Type) in the Stream to another Stream object.
    //
    // PARAMETERS
    // ==========
    //
    //   dest_stream ~ An object variable value that contains a
    //                 reference to an open Stream object. The current
    //                 Stream is copied to the destination Stream
    //                 specified by DestStream. The destination Stream
    //                 must already be open. If not, a run-time error
    //                 occurs.
    //
    //   num_chars  ~ Optional. An Integer value that specifies the
    //                number of bytes or characters to be copied from
    //                the current position in the source Stream to the
    //                destination Stream. The default value is –1,
    //                which specifies that all characters or bytes are
    //                copied from the current position to EOS.
    //
    copyto (dest_stream, num_bytes) {

        if (num_bytes === -1 || num_bytes === 0) {
            num_bytes = this.buffer.length;
        }

        console.log("Copying from s1 pos:", this.pos);

        let source_buf = this.buffer.slice(this.pos, num_bytes);
        dest_stream.write(source_buf);

        this.ee.emit("@ADODBStream::CopyTo", {
            dest      : dest_stream,
            num_bytes : num_bytes,
            src_buf   : source_buf
        });
    }




    //
    // Open
    // ====
    //
    // MSDN: https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/open-method-ado-stream
    // W3:   https://www.w3schools.com/asp/met_stream_open.asp
    //
    // SYNOPSIS
    // ========
    //
    // Opens a Stream object to manipulate streams of binary or text
    // data.
    //
    // PARAMETERS
    // ==========
    //
    // source  ~ Optional. The data source for the Stream object (a URL
    //           that points to an existing node in a tree structure,
    //           like an e-mail or file system or a reference to an
    //           already opened Record object). If source is not
    //           specified, a new Stream object, with a size of zero,
    //           will be created and opened.
    //
    // mode    ~ Optional. A ConnectModeEnum value that specifies the
    //           access mode for a Stream object. Default is
    //           adModeUnknown.
    //
    // opt      ~ Optional. A StreamOpenOptionsEnum value that specifies
    //            options for opening a Stream object. Default is
    //            adOpenStreamUnspecified.
    //
    // username ~ Optional. A name of a user who can access the Stream
    //            object. If Source is an already opened Record, this
    //            parameter is not specified.
    //
    // password ~ Optional. A password that validates the username.
    //            If Source is an already opened Record, this arameter
    //            is not specified.
    //
    // MODE ENUM
    // =========
    //
    // | Name           | Value    | Description                                                     |
    // |----------------|----------|-----------------------------------------------------------------|
    // | Unknown        | 0        | Default. Permissions have not been set or cannot be determined. |
    // | Read           | 1        | Read only.                                                      |
    // | Write          | 2        | Write only.                                                     |
    // | ReadWrite      | 3        | Read / Write.                                                   |
    // | ShareDenyRead  | 4        | Prevents others from opening a connection with read perms.      |
    // | ShareDenyWrite | 8        | Prevents others from opening a connection with write perms.     |
    // | ShareExclusive | 12       | Prevents others from opening a connection.                      |
    // | ShareDenyNone  | 16       | Allows others to open a connection with any permissions.        |
    // | Recursive      | 0x400000 | Used to set perms on all sub-recs of the current record.        |
    //
    open (source, mode, opt, username, password) {

        this.ee.emit("@ADODBStream::Open", arguments);

        if (source) {
            this.context.exceptions.throw_not_yet_implemented(
                "ADODBStream",
                "ADODBStream.Open does not support a truthy 'source' value.",
                "Calling code has attempted to call ADODBStream.Open with a truthy "  +
                    "value passed as the 'source' parameter.  At this time, this "    +
                    "is not yet supported.  Please update Construct -- this feature " +
                    "may have been added.  If not, please raise this as a bug on "    +
                    "GitHub, here: https://github.com/bobbystacksmash/Construct/issues."
            );
        }

        if (this.stream_is_open) {
            this.context.exceptions.throw_not_allowed(
                "ADODBStream",
                "ADODBStream.Open() cannot be called when the stream is already open.",
                "Calling code has called 'Open()' twice -- this exception is thrown when " +
                    "open is called more than once.");
        }

        this.stream_is_open = true;
    }

    //
    // Write
    // =====
    //
    // W3: https://www.w3schools.com/asp/met_stream_write.asp
    //
    // SYNOPSIS
    // ========
    //
    // The Write method is used to write binary data to a binary
    // Stream object.
    //
    // If there is data in the Stream object and the current position
    // is EOS, the new data will be appended beyond the existing
    // data. If the current position is not EOS, the existing data
    // will be overwritten.
    //
    // If you write past EOS, the size of the Stream will
    // increase. EOS will be set to the last byte in the Stream. If
    // you don't write past EOS, the current position will be set to
    // the next byte after the newly added data. Previously existing
    // data will not be truncated. Call the SetEOS method to truncate.
    //
    // NOTE: This method is used only with binary Stream objects, for
    //       textStream objects, use the WriteText method.
    //
    write (buf) {

        if (this.stream_is_open === false) {
            throw new Error("TODO: Update this with the correct exception.");
        }

        // What's the length of the incoming buffer?
        let incoming_buf_len = buf.length;

        if (this.buffer.byteLength === 0) {
            this.buffer = Buffer.from(buf);
        }
        else {
            this.buffer = Buffer.concat([this.buffer, Buffer.from(buf)]);
        }

        this.eos_marker = this.buffer.length;
        this.pos        = this.buffer.length;

        this.ee.emit("@ADODBStream::Write", { buffer: buf });
    }

    //
    // WriteText
    // =========
    //
    // MSDN: https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/writetext-method
    //
    // SYNOPSIS
    // ========
    //
    // Writes a specified text string to a Stream object.
    //
    writetext (txt, add_line_sep) {

        txt = txt || "";

        if (!this.stream_is_open) {
            this.context.exceptions.throw_operation_not_allowed_when_closed(
                "ADODB.Stream",
                `The following textual data was attempted to be written ` +
                    `to this stream, however the stream is not open. Text data: ` +
                    `"${txt}".`,
                `All streams must be OPEN before data can be written to them. ` +
                    `Calling code has attempted to write the following to this ` +
                    `stream instance without first calling 'open()': "${txt}".`
            );
        }

        if (txt === "") {
            this.buffer = new Buffer("", "utf-8");
        }
    }

    read (len) {

        if (len >= this.buffer.length) {
            len = this.buffer.length;
        }

        let buf;

        if (len === -1 || len === undefined || len === null) {
            buf = this.buffer.slice(0);
        }
        else {
            buf = this.buffer.slice(0, len);
        }

        return [...buf];
    }


    //
    // SetEOS
    // ======
    //
    // MSDN: https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/seteos-method
    //
    // SYNOPSIS
    // ========
    //
    // When called, it sets the current EOS value to be the end of the
    // stream.  Any bytes which exist BEYOND the new EOS value are
    // truncated.
    //
    seteos (offset) {

        let old_buf = this.buffer,
            new_buf = this.buffer.slice(0, offset);

        this.buffer = new_buf;
        this.eos_marker = offset;

        this.ee.emit("@ADODBStream::SetEOS", {
            offset: offset,
            old_buf: old_buf,
            new_buf: new_buf
        });
    }

    //
    // SaveToFile
    // ==========
    //
    // The SaveToFile method is used to save the binary contents of an
    // open Stream object to a local file.
    //
    // Note: After a call to this method, the current position in the
    // stream is set to the beginning of the stream (Position=0).
    //
    // PARAMETERS
    // ==========
    //
    // filename ~ Required. The name of the file to save the contents
    //            of the Stream object.
    //
    // options ~ Optional. An enum value that specifies whether a file
    //           should be created if it does not exist, or
    //           overwritten. Default is `SaveCreateNotExist'.
    //
    // SAVE ENUM
    // =========
    //
    // | Name                | Value | Description                                        |
    // |---------------------|-------|----------------------------------------------------|
    // | SaveCreateNotExist  | 1     | Default. Creates a new file if file ! exists.      |
    // | SaveCreateOverwrite | 2     | Overwrites the file with the data from the stream. |
    //
    savetofile (filename, option) {

        console.log("ADODBSTREAM.SAVE->", filename, "opt", option);
    }


    close () {
        console.log("ADODBSTREAm.CLOSE()");
    }

}


module.exports = function create(context) {
    let adodbstream = new JS_ADODBStream(context);
    return proxify(context, adodbstream);
};
