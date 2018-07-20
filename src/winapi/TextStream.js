// https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/312a5kbt%28v%3dvs.84%29

const Component        = require("../Component");
const proxify          = require("../proxify2");
const AbstractIOStream = require("./support/AbstractIOStream");

class JS_TextStream extends Component {

    // TextStream
    // ==========
    //
    // Creates a read/write text stream.
    //
    // Arguments
    // *********
    //
    //   - context [string]
    //     The Construct context object.
    //
    //   - backing_stream_spec [string]
    //     A path to the file which will "back" this stream.
    //
    //   - can_read [bool]
    //     Streams can be in read or write mode.  When `can_read' is
    //     true, reading is enabled.
    //
    //   - write_mode [number]
    //     There are three write modes:
    //       0 :: writing is forbidden,
    //       1 :: overwrite the contents of the file (pos marker at zero)
    //       2 :: append new content to the end of an existing file.
    //
    //   - use_unicode [bool]
    //     Streams may be open in either ASCII or Unicode mode.  If
    //     `use_unicode' is TRUE then Unicode text will be written to
    //     the backing file.  ASCII by default.
    //
    //   - persist [bool]
    //     When set to TRUE, will ensure that after each
    //     #Write... call, the contents written are immediately
    //     serialised to disk.
    //
    constructor (context, backing_stream_spec, can_read, write_mode, use_unicode, persist) {

        let charset = "ASCII";

        if (use_unicode) {
            charset = "Unicode";
        }

        super(context, "TextStream");

        this.ee  = this.context.emitter;
        this.vfs = this.context.vfs;
        this.backing_stream = backing_stream_spec;
        this.persist = (persist === undefined || persist === null) ? false : true;

        this.stream = new AbstractIOStream(
            context,
            backing_stream_spec,
            can_read,
            write_mode,
            charset
        );
    }

    // PROPERTIES
    // ==========
    //

    // Returns True if the end-of-a-line marker has been reached, or
    // False if not.  From the MSDN docs, it says that `AtEndOfLine'
    // returns True when "the file pointer is positioned immediately
    // before the end-of-line marker in a AbstractIOStream file".
    get atendofline () {
        this.ee.emit("TextStream.AtEndOfLine [GET]");
        return this.stream.AtEndOfLine;
    }

    // Read-Only - this throws.
    set atendofline (_) {
        this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
            "TextStream",
            "Attempted to write to a read only property.",
            "The .AtEndOfLine property cannot be assigned-to, only read-from."
        );
    }

    // Returns True if the end of a stream has been reached, or False
    // if not.
    get atendofstream () {
        this.ee.emit("TextStream.AtEndOfStream [GET]");
        return this.stream.AtEndOfStream;
    }

    // Read-Only - this throws.
    set atendofstream (_) {
        this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
            "TextStream",
            "Attempted to write to a read only property.",
            "The .AtEndOfStream property cannot be assigned-to, only read-from."
        );
    }

    // Returns the current column number of the current character
    // position within the stream.
    get column ( ) {
        return this.stream.Column;
    }

    // Read-Only - this throws.
    set column (_) {
        this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
            "TextStream",
            "Attempted to write to a read only property.",
            "The .Column property cannot be assigned-to, only read-from."
        );
    }

    // Read-only property that returns the current line number in a
    // AbstractIOStream file.
    get line () {
        return this.stream.Line;
    }

    // Read-Only - this throws.
    set line (_) {
        this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
            "TextStream",
            "Attempted to write to a read only property.",
            "The .Line property cannot be assigned-to, only read-from."
        );
    }

    //
    // WIN METHODS
    // ===========

    // Closes the stream.
    close () {

        if (arguments.length > 0) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "TextStream",
                "Attempted to pass at least one argument to #Close.",
                "The TextStream #Close() method does not accept any parameters " +
                    "and will throw if any are passed to it."
            );
        }

        try {
            this.stream.close();

            // '2' below means "overwrite on create":
            this.stream.Write(this.backing_stream, 2);
        }
        catch (_) {
            // Multiple calls to #Close are fine -- just trap the
            // exception and move on.
        }
    }

    // Reads a specified number of characters from a AbstractIOStream file
    // and returns the resulting string.
    read (n_chars) {

        try {
            return this.stream.Read(n_chars);
        }
        catch (e) {
            if (e.message.includes("Reading is forbidden")) {
                this.context.exceptions.throw_bad_file_mode(
                    "TextStream",
                    "This TextStream instance is not readable.",
                    "Unable to read from this TextStream as reading has been " +
                        "disabled."
                );
            }
            else if (e.message.includes("At EOS")) {
                this.context.exceptions.throw_input_past_end_of_file(
                    "TextStream",
                    "Cannot Read beyond the bounds of the stream.",
                    "The stream marker is currently at the end-of-stream (EOS) " +
                        "position, and no further characters can be read."
                );
            }

            throw e;
        }

        return "";
    }

    // Reads an entire AbstractIOStream file and returns the resulting
    // string.
    readall () {

        try {
            return this.stream.ReadAll();
        }
        catch (e) {

            if (e.message.includes("Reading is forbidden")) {
                this.context.exceptions.throw_bad_file_mode(
                    "TextStream",
                    "This TextStream insatnce is not readable.",
                    "Unable to call #ReadAll on this TextStream instance as " +
                        "reading from the stream is disabled."
                );
            }
            else if (e.message.includes("Cannot call ReadAll on an empty file")) {
                this.context.exceptions.throw_bad_file_mode(
                    "TextStream",
                    "The file which was attempted to be read is empty.",
                    "Cannot call #ReadAll on a file which is empty."
                );
            }
            else if (e.message.includes("At EOS")) {
                this.context.exceptions.throw_input_past_end_of_file(
                    "TextStream",
                    "Cannot Read stream -- at end of stream.",
                    "Unable to perform a #ReadAll operation as the stream's internal " +
                        "marker is already at or past the end of stream marker."
                );
            }

            throw e;
        }
    }

    // Reads an entire line (up to, but not including, the newline
    // character) from a AbstractIOStream file and returns the resulting
    // string.
    readline () {

        try {
            return this.stream.ReadLine();
        }
        catch (e) {

            if (e.message.includes("Reading is forbidden")) {
                this.context.exceptions.throw_bad_file_mode(
                    "TextStream",
                    "This TextStream instance is not readable.",
                    "Unable to call #ReadLine on this TextStream instance as " +
                        "reading from the stream is disabled."
                );
            }

            else if (e.message.includes("Cannot call ReadLine on an empty file")) {
                this.context.exceptions.throw_input_past_end_of_file(
                    "TextStream",
                    "Cannot complete ReadLine as the file is empty.",
                    "Unable to call #ReadLine successfully because the file backed by " +
                        "this TextStream is empty."
                );
            }
            else if (e.message.includes("At EOS")) {
                this.context.exceptions.throw_input_past_end_of_file(
                    "TextStream",
                    "Cannot complete ReadLine as EOF is reached.",
                    "Unable to call #ReadLine successfully because the TextStream's internal pointer " +
                        "has advanced to or beyond the end of the file."
                );
            }

            throw e;
        }
    }

    // Skips a specified number of characters when reading a
    // AbstractIOStream file.
    skip (n_chars) {

        if (n_chars < 0) {
            this.context.exceptions.throw_invalid_fn_arg(
                "TextStream",
                "Skip method only supports integers greater than or equal to 0.",
                "Cannot pass any negative number or non-numeric value to #Skip."
            );
        }

        try {
            this.stream.Skip(n_chars);
        }
        catch (e) {

            if (e.message.includes("Reading is forbidden")) {
                this.context.exceptions.throw_bad_file_mode(
                    "TextStream",
                    "This TextStream instance is not readable.",
                    "Unable to call #Skip on this TextStream instance as " +
                        "reading from the stream is disabled."
                );
            }

            throw e;
        }

    }

    // Skips the next line when reading a AbstractIOStream file.
    skipline () {
        try {
            this.stream.SkipLine();
        }
        catch (e) {

            if (e.message.includes("Reading is forbidden")) {
                this.context.exceptions.throw_bad_file_mode(
                    "TextStream",
                    "This TextStream instance is not readable.",
                    "Unable to call #SkipLine on this TextStream instance as " +
                        "reading from the stream is disabled."
                );
            }
            else if (e.message.includes("Cannot call SkipLine on an empty file")) {

                this.context.exceptions.throw_bad_file_mode(
                    "TextStream",
                    "This TextStream instance is not readable.",
                    "Unable to call #SkipLine on this TextStream instance as " +
                        "reading from the stream is disabled."
                );
            }
            else if (e.message.includes("At EOS")) {
                this.context.exceptions.throw_input_past_end_of_file(
                    "TextStream",
                    "Cannot Read stream -- at end of stream.",
                    "Unable to perform a #SkipLine operation as the stream's internal " +
                        "marker is already at or past the end of stream marker."
                );
            }

            throw e;
        }
    }

    // Writes a specified string to a AbstractIOStream file.
    write (msg) {

        try {
            this.stream.Write(msg);

            //if (this.persist) {
            //    console.log(this.stream);
            //    this.stream.save_to_file(this.backing_stream, 2);
            //}

        }
        catch (e) {

            if (e.message.includes("Writing is forbidden")) {
                this.context.exceptions.throw_bad_file_mode(
                    "TextStream",
                    "This stream instance is not writable.",
                    "Unable to call #Write on this TextStream instance as " +
                        "writing to the stream is stabled."
                );
            }

            throw e;
        }
    }

    // Writes a specified number of newline characters to a AbstractIOStream
    // file.
    writeblanklines (num_blank_lines_to_write) {

        try {
            this.stream.WriteBlankLines(num_blank_lines_to_write);
        }
        catch (e) {

            if (e.message.includes("Writing is forbidden")) {
                this.context.exceptions.throw_bad_file_mode(
                    "TextStream",
                    "This stream instance is not writable.",
                    "Unable to call #WriteBlankLines on this TextStream instance as " +
                        "writing to the stream is disabled."
                );
            }
        }
    }

    // Writes a specified string and newline character to a AbstractIOStream
    // file.
    writeline (msg) {

        try {
            this.stream.WriteLine(msg);
        }
        catch (e) {

            if (e.message.includes("Writing is forbidden")) {
                this.context.exceptions.throw_bad_file_mode(
                    "TextStream",
                    "This stream instance is not writable.",
                    "Unable to call #WriteLine on this TextStream instance as " +
                        "writing to the stream is disabled."
                );
            }
        }
    }
}

module.exports = function create(context, backing_path, can_read, write_mode, use_unicode, persist) {
    let ts = new JS_TextStream(context, backing_path, can_read, write_mode, use_unicode, persist);
    return proxify(context, ts);
};
