const Component        = require("../Component");
const proxify          = require("../proxify2");
const TextStream       = require("./support/TextStream");
const BinaryStream     = require("./support/BinaryStream");
const ExceptionHandler = require("../ExceptionHandler");

const STREAM_TYPE_ENUM = {
    adTypeBinary: 1,
    adTypeText:   2
};

class JS_ADODBStream extends Component {

    constructor (context) {
        super(context, "ADODBStream");
        this.ee  = this.context.emitter;
        this.vfs = this.context.vfs;

        this.stream = new TextStream(context);
    }

    get type () {
        return this.stream.type;
    }
    set type(x) {

        if (this.stream.can_change_stream_type) {

            if (this.stream.constructor.name === "TextStream") {
                this.stream = this.stream.to_binary_stream();
            }
            else {
                this.stream = this.stream.to_text_stream();
            }

            return;
        }

        this.context.exceptions.throw_operation_not_permitted_in_context(
            "ADODB.Stream",
            "Cannot change type when .position is not 0 (zero).",
            "Exception thrown because ADODB Stream instances cannot " +
                "change their type UNLESS the '.position' property is " +
                "set to 0 (zero) first.  This goes for streams which are " +
                "empty, or which contain data."
        );
    }


    get size () {
        return this.stream.size + 2;
    }
    set size (x) {
    }

    get position () {
        return this.stream.position;
    }

    open () {
        this.stream.open();
    }

    close () {

    }

    read () {

    }

    readtext () {

    }

    write () {
    }

    writetext (text) {
        this.stream.put(text);
    }

    flush () {

    }

    copyto () {

    }

    skipline () {

    }

    seteos () {

    }

    savetofile () {

    }

    loadfromfile () {

    }

    cancel () {

    }
}


module.exports = function create(context) {
    let adodbstream = new JS_ADODBStream(context);
    return proxify(context, adodbstream);
};
