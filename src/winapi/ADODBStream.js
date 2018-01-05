const proxify2 = require("../proxify2");
const events   = require("../events");

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

module.exports = function ADODBStream (opts) {

    let ee = opts.emitter;

    function Open (source, mode, opts, user, password) {
        ee.emit(events.WINAPI.ADODB.Stream.Open, {
            source: source,
            mode: mode,
            opts: opts,
            user: user,
            password: password
        });

        /*console.log(`ADODBStream.Open ` + source);
        console.log(`ADODBStream.Open OPTS: ${JSON.stringify(opts)}`);*/
    }


    function Write (buffer) {

        ee.emit(events.WINAPI.ADODB.Stream.Write, {
            buffer: buffer
        });

        //console.log("MOCK_WRITE: " + buffer);
    }


    function SaveToFile (filename, save_opts) {

        ee.emit(events.WINAPI.ADODB.Stream.SaveToFile, {
            filename: filename,
            save_opts: save_opts
        });

        /*console.log("ADODB: Save to file: " + filename);
        console.log(save_opts, "<-- save opts (saveTofile)");*/
    }


    function Close () {
        //console.log("ADODB :: Close (mark this obj as closed)");
    }

    let ADODBStream = {
        Open: Open,
        Write: Write,
        SaveToFile: SaveToFile,
        Close: Close
    };

    return proxify2(ADODBStream, "ADODBStream", opts);
}
