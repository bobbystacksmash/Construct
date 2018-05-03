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

/*
 * ADODB Stream
 * ============
 *
 * This class is really just a wrapper around two other classes:
 *
 *  - TextStream
 *  - BinaryStream
 *
 * They abstract the core functionality of actually doing "stream
 * stuff".  This class really just serves as a router for ADODB.Stream
 * requests and throwing correct exceptions.
 */

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

    get _underlying_stream () {
        return this.stream;
    }

    get mode () {
        this.ee.emit("@ADODBStream.Mode [GET]");
        return this.stream.mode;
    }
    set mode (mode) {
        this.ee.emit("@ADODBStream.Mode [SET]", arguments);
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
        this.ee.emit("@ADODBStream.Charset [GET]");

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
        this.ee.emit("@ADODBStream.Charset [SET]", new_charset);

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

        try {
            this.stream.charset = new_charset;
        }
        catch (e) {

            if (e.message.includes("unknown charset supplied")) {
                this.context.exceptions.throw_args_wrong_type_or_out_of_range_or_conflicted(
                    "ADODB.Stream",
                    "Cannot set charset to an unknown value.",
                    "The charset can't be set to an unknown value.  The currently supported " +
                        "list of charsets are: 'Unicode' and 'ASCII'.  All other values will " +
                        "cause this exception to be thrown."
                );
            }
        }
    }

    get lineseparator () {
        this.ee.emit("@ADODBStream.LineSeparator [GET]", this.stream.separator);
        return this.stream.separator;
    }
    set lineseparator (line_sep_opt) {
        this.ee.emit("@ADODBStream.LineSeparator [SET]", arguments);

        if (this._is_binary_stream()) {

            this.context.exceptions.throw_args_wrong_type_or_out_of_range_or_conflicted(
                "ADODB.Stream",
                "Cannot set '.LineSeparator' when stream is in binary mode.",
                "A binary stream dies not support the '.LineSeparator' property " +
                    "and throws accordingly.  Please switch to a TextStream (mode 2) " +
                    "if you require line separator / line skip modes."
            );
        }

        if (line_sep_opt !== LINE_SEPARATOR_ENUM.adCR &&
            line_sep_opt !== LINE_SEPARATOR_ENUM.adCRLF &&
            line_sep_opt !== LINE_SEPARATOR_ENUM.adLF) {

            this.context.exceptions.throw_args_wrong_type_or_out_of_range_or_conflicted(
                "ADODB.Stream",
                "Cannot set '.LineSeparator' to unknown value.",
                "The only permitted values for the '.LineSeparator' are defined within the " +
                    "LineSeparatorsEnum, here: https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/lineseparatorsenum. " +
                    "Accepted values are: 13 (CR), -1 (CRLF), or 10 (LF)."
            );
        }

        this.stream.separator = line_sep_opt;
    }

    get eos () {
        this.ee.emit("@ADODBStream.EOS [GET]", this.stream.EOS);
        return this.stream.EOS;
    }
    set eos (_) {
        this.context.exceptions.throw_args_wrong_type_or_out_of_range_or_conflicted(
            "ADODB.Stream",
            "Cannot set EOS using a property.",
            "The EOS property cannot be updated via a property.  To set the end " +
                "of stream position, use the SetEOS method.  To determine the current " +
                "position, use the Position property."
        );
    }

    get type () {
        this.ee.emit("@ADODBStream.Type [GET]", this.stream.type);
        return this.stream.type;
    }
    set type(stream_type) {
        this.ee.emit("@ADODBStream.Type [SET]", arguments);

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
        try {
            this.stream.open();
        }
        catch (e) {
            if (e.message.includes("Cannot open an already opened stream")) {
                this.context.exceptions.throw_operation_not_allowed_when_object_is_open(
                    "ADODB.Stream",
                    "Open called on an already open stream.",
                    "ADODB Stream objects will throw this exception if they are already " +
                        "open, and calling-code tries to open them again."
                );
            }
        }
    }

    close () {

        try {
            this.stream.close();
        }
        catch (e) {

            if (e.message.includes("Cannot close an already closed stream")) {
                this.context.exceptions.throw_operation_not_allowed_when_closed(
                    "ADODB.Stream",
                    "Close called on an already closed stream.",
                    "ADODB Stream objects will throw this exception if they are already " +
                        "closed, and calling-code tries to close them again."
                );
            }
        }
    }

    read (num_bytes) {

        // Windows checks things in the following order:
        //
        //   1. is the type of `num_bytes' correct?
        //   2. is the stream open()?
        //   3. is the stream's type === text?
        //
        if (num_bytes === null) {
            this.context.exceptions.throw_type_mismatch(
                "ADODB.Stream",
                "Cannot read 'null' bytes.",
                "The `num_bytes' parameter, if supplied, cannot be null."
            );
        }

        if (this.stream.is_open === false) {
            this.context.exceptions.throw_operation_not_allowed_when_closed(
                "ADODB.Stream",
                "Cannot Read from this stream while the stream is closed.",
                "Streams must be open to be read from, and even then, depending on the " +
                    "stream type (text or binary), the method used to read from the stream " +
                    "differs. Ensure that the stream is open before calling #Read."
            );
        }

        if (this._is_text_stream()) {
            this.context.exceptions.throw_operation_not_permitted_in_context(
                "ADODB.Stream",
                "Cannot call #Read while stream is in text mode.",
                "This error is thrown when #Read is called on a text stream.  Either convert " +
                    "the stream to a binary stream, or use #ReadText to fetch the stream's content."
            );
        }

        if (this.stream.size === 0) {
            return null;
        }

        if (typeof num_bytes === "boolean") {

            if (num_bytes) {
                return this.stream.fetch_all();
            }
            else {
                return null;
            }
        }
        else if (isNaN(num_bytes)) {
            this.context.exceptions.throw_type_mismatch(
                "ADODB.Stream",
                "Cannot convert non-numeric value to a number",
                "Unable to convert the non-numeric string value to a valid number."
            );
        }
        else {
            this.stream.fetch_n_bytes(num_bytes);
        }
    }

    readtext (n_chars) {

        // ReadText appears to function in a slightly different way to
        // #Read.  It's checking order is:
        //
        //   1. context (throw if stream == binary)
        //   2. ...
        //
        if (this._is_binary_stream()) {
            this.context.exceptions.throw_operation_not_permitted_in_context(
                "ADODB.Stream",
                "Cannot ReadText while the stream's type is binary",
                "The stream is currently in 'binary' mode, meaning the only way to fetch " +
                    "data from the stream is to use 'Read' (not 'ReadText')."
            );
        }

        if (this.stream.is_open === false) {
            this.context.exceptions.throw_operation_not_permitted_in_context(
                "ADODB.Stream",
                "Cannot call #ReadText when the stream is not open.",
                "This stream is currently closed.  To successfully read from this stream " +
                    "calling code must first call #Open()."
            );
        }

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

    writetext (text, option) {

        if (this._is_binary_stream()) {

            this.context.exceptions.throw_operation_not_permitted_in_contex(
                "ADODB.Stream",
                "Cannot call WriteText while stream-type is binary (use text instead).",
                "The use of WriteText is not allowed when the stream type is set to binary.  " +
                    "To fix this, either change the stream type to Text or load data in to " +
                    "the stream using the LoadFromFile method."
            );
        }

        try {
            this.stream.put(text, option);
        }
        catch (e) {

            if (e.message.includes("Type mismatch")) {
                this.context.exceptions.throw_type_mismatch(
                    "ADODB.Stream",
                    "Type Mismatch",
                    "The value passed in to #WriteText is an incompatible type which cannot " +
                        "be written to the stream, most likely 'null'."
                );
            }
            else if (e.message.includes("Write Access Denied")) {
                this.context.exceptions.throw_permission_denied(
                    "ADODB.Stream",
                    "Access Denied",
                    "A write operation has failed because this stream is currently not " +
                        "writeable. Ensure that the '.mode' property is set correctly to " +
                        "permit writing to this stream."
                );
            }
            else if (e.message.includes("Unknown option value to #put")) {
                this.context.exceptions.throw_args_wrong_type_or_out_of_range_or_conflicted(
                    "ADODB.Stream",
                    "Invalid StreamWriteEnum passed to #WriteText",
                    "WriteText is optional, however, if it is present, the only valid value " +
                        "for it is '1' (numeric).  This describes the StreamWriteEnum, where " +
                        "'0' is default (do not add a line), and '1' will add the new-line value " +
                        "set in LineSeparator."
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

        if (this._is_text_stream()) {
            this.context.exceptions.throw_args_wrong_type_or_out_of_range_or_conflicted(
                "ADODB.Stream",
                "Cannot call Write on text-type streams.",
                "This stream is currently in text-mode, as set by the stream's .type property. " +
                    "Either use WriteText, or change to a binary stream and use LoadFromFile " +
                    "to write data to this stream."
            );
        }

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

        // Windows handles #Flush in the following sequence:
        //
        //  1. checks whether the number of args > 0 -> throws if TRUE
        //  2. throws if stream is closed.
        //
        if (arguments.length > 0) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "ADODB.Stream",
                "The Flush method accepts zero parameters.",
                "Flush cannot be called with any parameters."
            );
        }

        if (this.stream.is_open === false) {
            this.context.exceptions.throw_operation_not_allowed_when_object_is_open(
                "ADODB.Stream",
                "Cannot flush an unopened stream.",
                "This stream is not currently open, and therefore cannot be " +
                    "flushed.  Ensure the stream is open before calling Flush."
            );
        }
    }

    copyto (dst_stream, num_chars) {

        // When the `dst_stream' is closed, Windows (7) raises:
        //
        //  Arguments are of the wrong type, are out of acceptable
        //  range, or are in conflict with one another.
        //
        // An odd choice of message, given that other stream-closed
        // situations *do* alert that $some_stream is not open for
        // writing...
        //
        if (dst_stream._underlying_stream.stream_is_open === false) {
            this.context.exceptions.throw_args_wrong_type_or_out_of_range_or_conflicted(
                "ADODB.Stream",
                "The destination stream is closed for writing.",
                "Unable to write to the destination stream because it is currently closed."
            );
        }

        try {
            this.stream.copy_to(dst_stream._underlying_stream, num_chars);
        }
        catch (e) {

            if (e.message.includes("when stream instance is closed")) {
                this.context.exceptions.throw_operation_not_allowed_when_closed(
                    "ADODB.Stream",
                    "Cannot copy when either stream instance is closed.",
                    "This error is thrown when a stream instance is not open, meaning that the #CopyTo" +
                        "call fails."
                );
            }
        }
    }

    skipline () {

        if (this._is_binary_stream()) {
            this.context.exceptions.throw_operation_not_permitted_in_context(
                "ADODB.Stream",
                "Cannot call SkipLine when stream type is binary.",
                "The SkipLine method can only be called from a text stream."
            );
        }

        if (this.stream.is_open === false) {
            this.context.exceptions.throw_operation_not_allowed_when_closed(
                "ADODB.Stream",
                "Cannot call SkipLine when stream is closed.",
                "The SkipLine method cannot be used while the stream is closed."
            );
        }

        this.stream.skipline();
    }

    seteos () {

        // Order of checking:
        //
        //  - Number of params
        //  - Is stream open?
        //
        if (arguments.length > 0) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "ADODB.Stream",
                "SetEOS accepts zero parameters.",
                "Cannot call SetEOS with > 0 parameters."
            );
        }

        if (this.stream.is_closed) {
            this.context.exceptions.throw_operation_not_allowed_when_closed(
                "ADODB.Stream",
                "Cannot call SetEOS when the stream is closed.",
                "The SetEOS method cannot be used while the stream is closed."
            );
        }

        this.stream.set_EOS();
    }

    savetofile (path, opt) {
        try {
            this.stream.save_to_file(path, opt);
        }
        catch (e) {

            if (e.message.includes("the stream is not open")) {
                this.context.exceptions.throw_operation_not_allowed_when_closed(
                    "ADODB.Stream",
                    "Cannot call SaveToFile when the stream is closed.",
                    "Unable to save file using the SaveToFile method when the stream " +
                        "is closed.  Ensure the stream is open before saving."
                );
            }
            else if (e.message.includes("Path contains invalid characters.")) {
                this.context.exceptions.throw_write_to_file_failed(
                    "ADODB.Stream",
                    "Unable to write to the file - the path is invalid",
                    "The file cannot be written to because the specified path contains illegal " +
                        "characters.  Please see the MSDN documentation for which caracters are " +
                        "not permitted in Windows paths."
                );
            }
            else if (e.message.includes("Filename contains invalid characters.")) {
                this.context.exceptions.throw_write_to_file_failed(
                    "ADODB.Stream",
                    "Unable to write to the file - the filename contains invalid characters.",
                    "The file cannot be written to because the filename contains illegal characters " +
                        "Please see the MSDN documentation for which caracters are not permitted in " +
                        "Windows filenames."
                );
            }
            else if (e.message.includes("file already exists")) {
                this.context.exceptions.throw_write_to_file_failed(
                    "ADODB.Stream",
                    "Unable to write to the file - the file already exists.",
                    `Unable to write to file: ${path} because this file already exists and the option ` +
                        "value passed to SaveToFile is the default value (do not overwrite if exists)."
                );
            }

            throw e;
        }
    }

    loadfromfile (file) {

        try {
            this.stream.load_from_file(file);
        }
        catch (e) {

            if (e.message.includes("Unable to load file")) {
                this.context.exceptions.throw_file_could_not_be_opened(
                    "ADODB.Stream",
                    "Attempting to load file failed: " + file,
                    "The loading of a file has failed because this file could " +
                        "not be found.  Ensure the filename is correct and the " +
                        "file exists on the filesystem."
                );
            }
            else if (e.message.includes("the stream is not open")) {
                this.context.exceptions.throw_operation_not_allowed_when_closed(
                    "ADODB.Stream",
                    "Cannot load while the stream is closed.",
                    "The stream must be open in order for the file to be loaded. " +
                        "Please call .open() on this stream to allow loading from " +
                        "a file."
                );
            }

            throw e;
        }
    }

    cancel () {

        try {
            this.stream.cancel();
        }
        catch (e) {

            if (e.message.includes("Cannot cancel when stream is closed")) {
                this.context.exceptions.throw_operation_not_allowed_when_closed(
                    "ADODB.Stream",
                    "Cannot call Cancel while the stream is closed.",
                    "The stream must be open in order for Cancel to be called. " +
                        "Please ensure the stream is open before calling Cancel."
                );
            }
        }
    }
}


module.exports = function create(context) {
    let adodbstream = new JS_ADODBStream(context);
    return proxify(context, adodbstream);
};
