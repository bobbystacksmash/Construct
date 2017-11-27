/*
 * ============
 * ADODB Stream
 * ============
 *
 * N.B.
 * ====
 * A.D.O. =  Microsoft [A]ctiveX [D]ata [O]bjects.
 *
 * Represents a stream of binary data or text.
 *
 * https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/stream-object-ado
 * 
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

const winevts = require("../events");
const Proxify = require("../proxify");

function mock_MISSING_METHOD (prop) {
    return () => {
        let msg = `[ADODB.${prop}] - METHOD NOT YET IMPLEMENTED. ${JSON.stringify(arguments)}`;
        debugger;
        alert(msg)
        console.log(msg);
    };
}


function mock_Open (source, mode, opts, user, password) {
    console.log(`ADODB.mock_Open ` + source);
    console.log(`ADODB.mock_Open OPTS: ${JSON.stringify(opts)}`);
}


function mock_Write (buffer) {
    alert("mock_write: " + buffer);
}


function mock_SaveToFile (filename, save_opts) {
    alert("Save to file: " + filename);
    console.log(save_opts, "<-- save opts (saveTofile)");
}


function create (opts) {

    ee = opts.emitter || { emit: () => {}, on: () => {} };

    let mock_ADODB_Stream = {
        Cancel       : mock_MISSING_METHOD("Cancel"),
        Close        : mock_MISSING_METHOD("Close"),
        CopyTo       : mock_MISSING_METHOD("CopyTo"),
        Flush        : mock_MISSING_METHOD("Flush"),
        LoadFromFile : mock_MISSING_METHOD("LoadFromFile"),
        Open         : mock_Open,
        Read         : mock_MISSING_METHOD("Read"),
        ReadText     : mock_MISSING_METHOD("ReadText"),
        SaveToFile   : mock_SaveToFile,
        SetEOS       : mock_MISSING_METHOD("SetEOS"),
        SkipLine     : mock_MISSING_METHOD("SkipLine"),
        Stat         : mock_MISSING_METHOD("Stat"),
        Write        : mock_Write,
        WriteText    : mock_MISSING_METHOD("WriteText"),
    };

    let overrides = {
        get: (target, key) => {
            return mock_ADODB_Stream[key]
        }
    };

    var proxify = new Proxify({ emitter: ee });
    return proxify(mock_ADODB_Stream, overrides, "ADODB");
}

module.exports = create;
