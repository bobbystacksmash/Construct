/*
 * https://msdn.microsoft.com/en-us/subscriptions/312a5kbt(v=vs.84).aspx
 *
 * Facilitates sequential access to file.
 *
 * https://support.smartbear.com/testcomplete/docs/app-testing/desktop/console/working-with-stdin-and-stdout.html
 *
 * PROPERTIES
 * ==========
 * [ ] - AtEndOfLine   https://msdn.microsoft.com/en-us/subscriptions/kaf6yaft(v=vs.84).aspx
 * [ ] - AtEndOfStream https://msdn.microsoft.com/en-us/subscriptions/ffk3x3bw(v=vs.84).aspx
 * [ ] - Column        https://msdn.microsoft.com/en-us/subscriptions/3tza1eca(v=vs.84).aspx
 * [ ] - Line          https://msdn.microsoft.com/en-us/subscriptions/chsfhd43(v=vs.84).aspx
 *
 *
 * METHODS
 * =======
 * [x] - Close           https://msdn.microsoft.com/en-us/subscriptions/yb3tbdkw(v=vs.84).aspx
 * [x] - Read            https://msdn.microsoft.com/en-us/subscriptions/dhyx75w2(v=vs.84).aspx
 * [x] - ReadAll         https://msdn.microsoft.com/en-us/subscriptions/t58aa4dd(v=vs.84).aspx
 * [x] - ReadLine        https://msdn.microsoft.com/en-us/subscriptions/h7se9d4f(v=vs.84).aspx
 * [x] - Skip            https://msdn.microsoft.com/en-us/subscriptions/08xz3c5a(v=vs.84).aspx
 * [x] - SkipLine        https://msdn.microsoft.com/en-us/subscriptions/zbhhkawe(v=vs.84).aspx
 * [x] - Write           https://msdn.microsoft.com/en-us/subscriptions/6ee7s9w2(v=vs.84).aspx
 * [x] - WriteBlankLines https://msdn.microsoft.com/en-us/subscriptions/eysctzwa(v=vs.84).aspx
 * [x] - WriteLine       https://msdn.microsoft.com/en-us/subscriptions/t5399c99(v=vs.84).aspx
 */

const winevts  = require("../events");
const proxify2 = require("../proxify2");

var buf            = [];
var buf_closed     = false;
var buf_offset_ptr = 0;

var at_end_of_line   = false;
var at_end_of_stream = false;
var column           = 0;
var num_lines        = 1;

var for_reading      = false;
var for_appending    = false;



function throw_bad_file_mode (msg) {

    throw {
        name: "BadFileMode",
        message: msg,
        toString: () => `${this.name}: ${this.message}`
    };
}



function mock_MISSING_METHOD (name) {
    let msg = `[WshShell.${name}] - METHOD NOT YET IMPLEMENTED.`;
    alert(msg)
    console.log(msg);
}

function mock_Close () {
    buf_closed = true;
}


function mock_Read (num_chars) {

    // TODO: Add something to check num_chars is numeric...

    var output = ""

    for (var i = buf_offset_ptr; i < num_chars; i++) {
        output += buf[i];
    }

    buf_offset_ptr += num_chars;
    return output;
}


function mock_ReadAll () {
    return buf.join("");
}


function mock_ReadLine () {
    var line = "",
        scan = true,
        ptr  = buf_offset_ptr;

    while (scan) {

        if (buf[ptr] === "\r") {
            // End of line...
            scan = false;
            buf_offset_ptr++;
            break;
        }

        line += buf[ptr];
        buf_offset_ptr++;
    }

    line = line.replace(/\r$/, "");
    return line;
}


function mock_Skip (num_chars) {
    buf_offset_ptr += num_chars;
}


function mock_SkipLine () {
    while (buf_offset_ptr++) {
        if (buf[buf_offset_ptr] == "\n") {
            break;
        }
    }
}


function mock_Write (str) {
    // TODO
    //
    // - What happens if we're already at the end of a stream and we write to it?
    // - Raise some kind of event here; this is something worth capturing...
    buf += str;
}


function mock_WriteBlankLines (num_lines) {
    for (var i = 0; i < num_lines; i++) {
        buf += "\r\n";
    }
}


function mock_WriteLine (text) {

    if (text) {
        buf += text;
    }

    buf += "\r\n";
}


function create(opts, buffer, iomode) {

    ee = opts.emitter || { emit: () => {}, on: () => {} };

    if (buffer) {
        buf = buffer;
    }

    // https://msdn.microsoft.com/en-us/library/aa265347(v=vs.60).aspx
    //
    // +--------------+-------+-----------------------------------------------------+
    // |   CONSTANT   | VALUE | DESCRIPTION                                         |
    // +--------------+-------+-----------------------------------------------------+
    // |   ForReading |   1   | Open a file for reading only. Cannot be written to. |
    // |   ForWriting |   2   | Open a file for writing only. Cannot be read from.  |
    // | ForAppending |   3   | Open a file and write to the end of the file.       |
    // +--------------+-------+-----------------------------------------------------+
    //
    // These modes control what we can and can't do when reading a TextStream.
    //
    if (iomode === 1 /* ForReading */) {
        for_reading = true;
    }
    else if (iomode === 2 /* ForWriting */) {
        for_writing = true;
    }
    else if (iomode === 2 /* ForWriting */) {
        for_appending = true;
    }
    
    
    let mock_TextStream = {
        Close:           mock_Close,
        Read:            mock_Read, 
        ReadAll:         mock_ReadAll,
        ReadLine:        mock_ReadLine,
        Skip:            mock_Skip,
        SkipLine:        mock_SkipLine,
        Write:           mock_Write,
        WriteBlankLines: mock_WriteBlankLines,
        WriteLine:       mock_WriteLine
    };
}

module.exports = function TextStream (opts) {

    let ee  = opts.emitter,
        buf = opts.buffer;

    let NOOP = () => {
        console.log("TextStream noop");
    };


    let TextStream = {
        Close: NOOP,
        Read: () => buf,
        ReadAll: () => buf,
        ReadLine: () => buf,
        Skip: NOOP,
        SkipLine: NOOP,
        Write: NOOP,
        WriteBlankLines: NOOP,
        WriteLine: NOOP,

        AtEndOfLine: null,
        AtEndOfStream: null,
        Column: null,
        Line: null,
    };

    return proxify2(TextStream, "TextStream", opts);
};
