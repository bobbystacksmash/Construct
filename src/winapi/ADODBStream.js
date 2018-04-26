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

    get mode () {
        return this.stream.mode;
    }
    set mode (mode) {

        if (this.stream.is_open) {
            this.context.exceptions.throw_operation_not_allowed_when_object_is_open(
                "ADODB.Stream",
                "Cannot change a stream's mode while the stream is open.",
                "Streams have different modes, where each mode-value controls stream " +
                    "permissions, such as read-only, etc.  To change the mode of a " +
                    "stream, the stream must first be closed."
            );
        }

        try {
            this.stream.mode = mode;
        }
        catch (e) {
            this.context.exceptions.throw_args_wrong_type_or_out_of_range_or_conflicted(
                "ADODB.Stream",
                "Stream mode value is unknown",
                "The stream mode value has been set to an invalid or unknown value."
            );
        }
    }

    get charset () {

        if (this._is_binary_stream()) {
            this.context.exceptions.throw_operation_not_permitted_in_context(
                "ADODB.Stream",
                "Cannot get charset when stream is in binary mode.",
                "The '.charset' property cannot be requested while " +
                    "the ADODB.Stream is in binary mode.  The mode " +
                    "can be changed by setting position to zero, and " +
                    "setting the '.type' property."
            );
        }

        return this.stream.charset;
    }
    set charset (new_charset) {

        if (this._is_binary_stream()) {
            this.context.exceptions.throw_operation_not_permitted_in_context(
                "ADODB.Stream",
                "Cannot set charset when stream is in binary mode.",
                "The '.charset' property cannot be updated while " +
                    "the ADODB.Stream is in binary mode.  The mode " +
                    "can be changed by setting position to zero, and " +
                    "setting the '.type' property."
            );
        }

        if (this.stream.pos !== 0) {
            this.context.exceptions.throw_args_wrong_type_or_out_of_range_or_conflicted(
                "ADODB.Stream",
                "Cannot change charset while position is not zero.",
                "The charset property of a text stream cannot be changed " +
                    "until the stream's .position is set to zero."
            );
        }

        // TODO: Add try/carch around this:
        this.stream.charset = new_charset;
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
    set type(stream_type) {

        if (this.stream.stream_is_open && this.stream.position !== 0) {
            this.context.exceptions.throw_operation_not_permitted_in_context(
                "ADODB.Stream",
                "Cannot set '.type' while position is not zero.",
                "Unable to change the stream type unless the stream has its " +
                    ".position set to zero (the beginning of the stream)."
            );
        }

        if (stream_type !== STREAM_TYPE_ENUM.adTypeText && stream_type !== STREAM_TYPE_ENUM.adTypeBinary) {
            this.context.exceptions.throw_args_wrong_type_or_out_of_range_or_conflicted(
                "ADODB.Stream",
                ".Type property may only be set to '1' (binary) or '2' (text)",
                "Streams have two types: binary and text.  These can be set using " +
                    "numeric values '1' and '2' respectively.  Any other value is invalud " +
                    "and will trigger this exception to be thrown."
            );
        }

        let curr_stream_type = this.stream.constructor.name;

        if (curr_stream_type === "TextStream" && stream_type === STREAM_TYPE_ENUM.adTypeText ||
            curr_stream_type === "BinaryStream" && stream_type === STREAM_TYPE_ENUM.adTypeBinary) {
            // The stream type has been re-assigned, but with a type
            // which matches the existing stream.
            return;
        }

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

    get state () {
        return this.stream.state;
    }
    set state (_) {

    }


    get size () {
        return this.stream.size;
    }
    set size (_) {
        this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
            "ADODB.Stream",
            "Cannot assign-to the property: size",
            "The size property cannot be assigned-to in any state or context. " +
                "To change the stream's size, use .position and #SetEOS."
        );
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
            return;
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
        this.stream.close();
    }

    read () {

    }

    readtext (n_chars) {

        if (this.stream.is_open) {

            try {
                this.stream._assert_can_read();
            }
            catch (e) {
                this.context.exceptions.throw_operation_not_permitted_in_context(
                    "ADODB.Stream",
                    "Cannot ReadText while the stream's permissions do not permit reading",
                    "This stream is currently in a write-only mode, meaning that reads from " +
                        "it are not permitted. Please alter the .Mode property such that the " +
                        "stream is writeable."
                );
            }
        }

        try {
            return this.stream.fetch_n_chars(n_chars);
        }
        catch (e) {

        }
    }

    writetext (text) {
        try {
            this.stream.put(text);
        }
        catch (e) {

            if (e.message.includes("Write Access Denied")) {
                this.context.exceptions.throw_permission_denied(
                    "ADODB.Stream",
                    "Access Denied",
                    "A write operation has failed because this stream is currently not " +
                        "writeable. Ensure that the '.mode' property is set correctly to " +
                        "permit writing to this stream."
                );
            }
            else {
                this.context.exceptions.throw_operation_not_allowed_when_closed(
                    "ADODB.Stream",
                    "Cannot write to the stream when the stream is closed.",
                    "A write operation failed because this stream is currently closed. " +
                        "Please call '.open()' before attempting to write to this stream."
                );
            }
        }
    }

    write () {

        if (this._is_binary_stream()) {
            this.context.exceptions.throw_args_wrong_type_or_out_of_range_or_conflicted(
                "ADODB.Stream",
                "Cannot call '.write' against an ADODB Stream in binary mode, use 'loadfromfile' instead.",
                "Calling code has attempted to call '.write' while this ADODBStream is in abinary mode.  " +
                    "By calling '.write', code is attempting to pass binary data across a COM bridge " +
                    "but JScript lacks the language features (binary arrays) which would alllow it to " +
                    "pass data across in any format COM could recognise.  The work around is to either " +
                    "convert a text stream to a binary stream, or use 'LoadFromFile'."
            );
        }

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
