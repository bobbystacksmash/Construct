const Component = require("./Component"),
      ConstructError = require("./ConstructError");

class ExceptionHandler extends Component {

    constructor (context) {
        super(context, "Exceptions thrower");
        this.ee = this.context.emitter;
    }

    // Called whenever any of oour throw methods are called with
    // insufficient detail.
    _lazy_throw_protect (type, reason) {

        this._throw(
            "ExceptionHandler - Lazy throw protector",
            "lazy_throw_protector",
            "LazyExceptionThrown",
            `Insufficient detail provided by VM code when throwing ${type}.`,
            `A ${type} exception was thrown with insufficient detail.`,
            `A ${type} exception was thrown with insufficient detail.`,
            `Calling code within Construct is expected to be helpful, and ` +
                `provide both a summary, and detailed explaination as to why ` +
                `a given exception was thrown.  In this instance, we have ` +
                `detected that calling code did NOT supply enough detail, ` +
                `and we're therefore aborting the script with this message ` +
                `as an indicator that there is a quality issue which must be ` +
                `addressed.`);
    }

    _throw (name, message, number, description, _source, _summary, _description, type) {

        if (!_summary)     this._lazy_throw_protect(_source, "Summary is not defined.");
        if (!_description) this._lazy_throw_protect(_source, "Detailed description is not defined.");

        let throw_obj = {
            // MSFT properties
            name:         name,
            message:      message,
            number:       number,
            description:  description,
            toString:     () => message,

            // Construct informational properties
            source:      _source,
            summary:     _summary,
            description: _description,
            type:        type
        };
        const err = new ConstructError(throw_obj);
        this.context.emitter.emit("runtime.exception", err);
        throw err;
    }


    _throw_winapi_exception (name, message, number, description, _source, _summary, _description) {
        this._throw(name, message, number, description, _source, _summary, _description, "winapi");
    }

    _throw_native_exception (name, message, number, description, _source, _summary, _description) {
        this._throw(name, message, number, description, _source, _summary, _description, "native");
    }

    throw_error (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "",
            -2147024894,
            "",
            source,
            summary,
            details
        );
    }

    throw_file_not_found (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "File not found",
            -2146828235,
            "File not found",
            source,
            summary,
            details
        );
    }

    throw_path_not_found (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "Path not found",
            -2146828112,
            "Path not found",
            source,
            summary,
            details
        );
    }


    throw_invalid_fn_arg (source, summary, details) {
        this._throw_winapi_exception(
            "TypeError",
            "Invalid procedure call or argument",
            -2146828283,
            "Invalid procedure call or argument",
            source,
            summary,
            details
        );
    }


    throw_unsupported_prop_or_method (source, summary, details) {
        this._throw_winapi_exception(
            "TypeError",
            "Object doesn't support this property or method",
            -0, // TODO
            "Object doesn't support this property or method",
            source,
            summary,
            details
        );
    }

    throw_wrong_argc_or_invalid_prop_assign (source, summary, details) {
        this._throw_winapi_exception(
            "TypeError",                                                // name
            "Wrong number of arguments or invalid property assignment", // message
            -2146827838,                                                // number
            "Wrong number of arguments or invalid property assignment", // description
            source,
            summary,
            details
        );
    }

    throw_device_unavailable (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "Device unavailable",
            -2146828220,
            "Device unavailable",
            source,
            summary,
            details
        );
    }

    throw_not_allowed (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            'Operation is not allowed when the object is open.',
            -2146824583,
            'Operation is not allowed when the object is open.',
            source,
            summary,
            details);
    }


    throw_not_yet_implemented (source, summary, details) {
        this._throw_winapi_exception(
            "NotImplementedError",
            "The method is not yet implemented.",
            -0,
            "The method is not yet implemented",
            source,
            summary,
            details
        );
    }


    throw_operation_not_permitted_in_context (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "Operation is not allowed in this context.",
            -2146825069,
            "Operation is not allowed in this context.",
            source, summary, details
        );
    }


    throw_range_error (source, summary, details) {
        this._throw_winapi_exception(
            "RangeError",
            "",
            -2147024890,
            "",
            source, summary, details);
    }


    throw_args_wrong_type_or_out_of_range_or_conflicted (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "Arguments are of the wrong type, are out of acceptable range, or are in conflict with one another.",
            -2146825287,
            "Arguments are of the wrong type, are out of acceptable range, or are in conflict with one another.",
            source, summary, details
        );
    }


    throw_operation_not_allowed_when_object_is_open (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "Operation is not allowed when the object is open.",
            -2146824583,
            "Operation is not allowed when the object is open.",
            source, summary, details
        );
    }


    throw_operation_not_allowed_when_closed (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "Operation is not allowed when the object is closed.",
            -2146824584,
            "Operation is not allowed when the object is closed.",
            source, summary, details
        );
    }


    throw_parameter_is_incorrect (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "The parameter is incorrect.",
            -2147024809,
            "The parameter is incorrect.",
            source, summary, details
        );
    }


    throw_access_denied (source, summary, details) {
        this._throw_winapi_exception(
            "TypeError",
            "Access Denied.",
            -2147287035,
            "Access Denied.",
            source, summary, details
        );
    }

    throw_type_mismatch (source, summary, details) {
        this._throw_winapi_exception(
            "TypeError",
            "Type mismatch.",
            -2147352571,
            "Type mismatch.",
            source, summary, details
        );
    }

    throw_file_could_not_be_opened (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "File could not be opened.",
            -2146825286,
            "File could not be opened.",
            source, summary, details
        );
    }

    throw_write_to_file_failed (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "Write to file failed.",
            -2146825284,
            "Write to file failed.",
            source, summary, details
        );
    }

    throw_could_not_locate_automation_class (source, summary, details, class_name) {
        this._throw_winapi_exception(
            "RangeError",
            `Could not locate automation class named "${class_name}".`,
            -2147352567,
            `Could not locate automation class named "${class_name}".`,
            source, summary, details
        );
    }

    throw_file_already_exists (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "File already exists",
            -2146828230,
            "File already exists",
            source, summary, details
        );
    }

    throw_bad_filename_or_number (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "Bad file name or number",
            -2146828236,
            "Bad file name or number",
            source, summary, details
        );
    }

    throw_input_past_end_of_file (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "Input past end of file",
            -2146828226,
            "Input past end of file",
            source, summary, details
        );
    }

    throw_bad_file_mode (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "Bad file mode",
            -2146828234,
            "Bad file mode",
            source, summary, details
        );
    }

    throw_permission_denied (source, summary, details) {
        this._throw_winapi_exception(
            "Error",
            "Permission denied",
            -2146828218,
            "Permission denied",
            source, summary, details
        );
    }

    // ###########################################
    // # C O N S T R U C T   A P I   E R R O R S #
    // ###########################################

    // *** Virtual Registry ***
    throw_native_vreg_invalid_root (source, summary, details) {
        this._throw_native_exception(
            "VirtualRegistryError",
            summary,
            0,
            summary,
            source, summary, details
        );
    }

    throw_native_vreg_cannot_delete_root_key (source, summary, details) {
        this._throw_native_exception(
            "VirtualRegistryError",
            summary,
            0,
            summary,
            source, summary, details
        );
    }

    throw_native_vreg_delete_path_failed (source, summary, details) {
        this._throw_native_exception(
            "VirtualRegistry",
            summary,
            0,
            summary,
            source, summary, details
        );
    }

    throw_native_vreg_subkey_not_exists (source, summary, details) {
        this._throw_native_exception(
            "VirtualRegistry",
            summary,
            0,
            summary,
            source, summary, details
        );
    }
}

module.exports = ExceptionHandler;
