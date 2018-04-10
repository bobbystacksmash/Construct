const Component        = require("../Component");
const proxify          = require("../proxify2");
const TextStream       = require("./support/TextStream");
const BinaryStream     = require("./support/BinaryStream");
const ExceptionHandler = require("../ExceptionHandler");

const STREAM_TYPE_ENUM = {
    adTypeBinary: 1,
    adTypeText:   2
};

const LINE_SEPARATOR_ENUM = {
    adCR:    13,
    adCRLF: -1, // DEFAULT
    adLF:    10
};

class JS_ADODBStream extends Component {

    constructor (context) {
        super(context, "ADODBStream");
        this.ee  = this.context.emitter;
        this.vfs = this.context.vfs;

        this.stream = new TextStream(context);
    }

    _is_text_stream () {
        return this.stream.constructor.name === "TextStream";
    }

    _is_binary_stream () {
        return this.stream.constructor.name === "BinaryStream";
    }

    get lineseparator () {

    }
    set lineseparator (line_sep_opt) {

        if (this._is_binary_stream) {

            this.context.exceptions.throw_args_wrong_type_or_out_of_range_or_conflicted(
                "ADODB.Stream",
                "Cannot set '.LineSeparator' when stream is in binary mode.",
                "A binary stream dies not support the '.LineSeparator' property " +
                    "and throws accordingly.  Please switch to a TextStream (mode 2) " +
                    "if you require line separator / line skip modes."
            );
        }

        if (line_sep_opt !== LINE_SEPARATOR_ENUM.adCR ||
            line_sep_opt !== LINE_SEPARATOR_ENUM.adCRLF ||
            line_sep_opt !== LINE_SEPARATOR_ENUM.adLF) {

            this.context.exceptions.throw_args_wrong_type_or_out_of_range_or_conflicted(
                "ADODB.Stream",
                "Cannot set '.LineSeparator' to unknown value.",
                "The only permitted values for the '.LineSeparator' are defined within the " +
                    "LineSeparatorsEnum, here: https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/lineseparatorsenum. " +
                    "Accepted values are: 13 (CR), -1 (CRLF), or 10 (LF)."
            );
        }
    }

    get eos () {
        return this.stream.EOS;
    }
    set eos (_) {
        // TODO: does this throw?
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
        return (this.stream.size > 0)
            ? this.stream.size + 2
            : 0;
    }
    set size (x) {
    }

    get position () {




        try {
            return this.stream.position;
        }
        catch (e) {

            if (this.stream.is_closed) {
                this.context.exceptions.throw_operation_not_allowed_when_closed(
                    "ADODB.Stream",
                    "Cannot fetch '.position' when stream is closed.",
                    "Calling code has attempted to access the `.position' property " +
                        "of an ADODB Stream instance while the stream was 'closed'. " +
                        "ADODB Stream instances have two states: open and closed -- " +
                        "ensure the stream is open before calling '.position'."
                );
            }
            return false;
        }
    }
    set position (p) {

        try {
            this.stream.position = p;
        }
        catch (e) {

            if (this.stream.is_closed) {
                this.context.exceptions.throw_operation_not_allowed_when_closed(
                    "ADODB.Stream",
                    "Cannot fetch '.position' when stream is closed.",
                    "Calling code has attempted to alter the `.position' property " +
                        "of an ADODB Stream instance while the stream was 'closed'. " +
                        "ADODB Stream instances have two states: open and closed -- " +
                        "ensure the stream is open before calling '.position'."
                );
            }
            else if (p > this.stream.size) {
                this.context.exceptions.throw_parameter_is_incorrect(
                    "ADODB.Stream",
                    "Cannot set '.position' beyond the size of the stream.",
                    "Calling code has attempted to set the '.position' property " +
                        "to a value which is beyond the bounds of the stream's " +
                        "internal buffer."
                );
            }
            else if (p < 0) {
                this.context.exceptions.throw_args_wrong_type_or_out_of_range_or_conflicted(
                    "ADODB.Stream",
                    "Cannot set '.position' to a negative value.",
                    "Calling code has attempted to set the ADODB Stream's '.position' " +
                        "property to a negative value.  This is not allowed."
                );
            }
        }
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
        this.stream.set_EOS();
    }

    savetofile () {

    }

    loadfromfile (file) {
        this.stream.load_from_file(file);
    }

    cancel () {

    }
}


module.exports = function create(context) {
    let adodbstream = new JS_ADODBStream(context);
    return proxify(context, adodbstream);
};
