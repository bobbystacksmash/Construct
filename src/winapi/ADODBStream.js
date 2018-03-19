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
 * Represents a stream of binary data or text.
 *
 * https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/stream-object-ado
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
    }


    //
    // PROPERTIES
    // ==========
    //

    //
    // METHODS
    // =======
    //

    //
    // Open
    // ====
    //
    // MSDN: https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/open-method-ado-stream
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
    // source - Optional. 
    open () {
	console.log("ADODBSTREAM: OPEN CALLED, args:", arguments);
    }

    write () {
	console.log("ADODBSTREAM: WRITE CALLED, args:", arguments);
    }
    
}


module.exports = function create(context) {
    let adodbstream = new JS_ADODBStream(context);
    return proxify(context, adodbstream);
};
