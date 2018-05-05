const Component = require("./Component");

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

    _throw (name, message, number, description, _source, _summary, _description) {

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
            _source:      _source,
            _summary:     _summary,
            _description: _description
        };

        console.log("chucking", throw_obj);
        let err = new Error(throw_obj);

        this.ee.emit(`!Exception::${name}`, err);
        throw err;
    }


    throw_path_not_found (source, summary, details) {
        this._throw(
            "Error",
            "Path not found",
            -0, // TODO
            "Path not found",
            source,
            summary,
            details
        );
    }


    throw_invalid_fn_arg (source, summary, details) {
        this._throw(
            "TypeError",
            "Invalid procedure call or argument",
            -0, // TODO
            "Invalid procedure call or argument",
            source,
            summary,
            details
        );
    }


    throw_unsupported_prop_or_method (source, summary, details) {
        this._throw(
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
        this._throw(
            "TypeError",                                                // name
            "Wrong number of arguments or invalid property assignment", // message
            -2146827838,                                                // number
            "Wrong number of arguments or invalid property assignment", // description
            source,
            summary,
            details
        );
    }


    throw_not_allowed (source, summary, details) {
        this._throw(
            "Error",
            'Operation is not allowed when the object is open.',
            -2146824583,
            'Operation is not allowed when the object is open.',
            source,
            summary,
            details);
    }


    throw_not_yet_implemented (source, summary, details) {
        this._throw(
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
        this.throw(
            "Error",
            "Operation is not allowed in this context.",
            -2146825069,
            "Operation is not allowed in this context.",
            source, summary, details
        );
    }


    throw_args_wrong_type_or_out_of_range_or_conflicted (source, summary, details) {
        this.throw(
            "Error",
            "Arguments are of the wrong type, are out of acceptable range, or are in conflict with one another.",
            -2146825287,
            "Arguments are of the wrong type, are out of acceptable range, or are in conflict with one another.",
            source, summary, details
        );
    }


    throw_operation_not_allowed_when_object_is_open (source, summary, details) {
        this.throw(
            "Error",
            "Operation is not allowed when the object is open.",
            -2146824583,
            "Operation is not allowed when the object is open.",
            source, summary, details
        );
    }


    throw_operation_not_allowed_when_closed (source, summary, details) {
        this.throw(
            "Error",
            "Operation is not allowed when the object is closed.",
            -2146824584,
            "Operation is not allowed when the object is closed.",
            source, summary, details
        );
    }


    throw_parameter_is_incorrect (source, summary, details) {
        this.throw(
            "Error",
            "The parameter is incorrect.",
            -2147024809,
            "The parameter is incorrect.",
            source, summary, details
        );
    }


    throw_access_denied (source, summary, details) {
        this.throw(
            "TypeError",
            "Access Denied.",
            -2147287035,
            "Access Denied.",
            source, summary, details
        );
    }

    throw_type_mismatch (source, summary, details) {
        this.throw(
            "TypeError",
            "Type mismatch.",
            -2147352571,
            "Type mismatch.",
            source, summary, details
        );
    }

    throw_file_could_not_be_opened (source, summary, details) {
        this.throw(
            "Error",
            "File could not be opened.",
            -2146825286,
            "File could not be opened.",
            source, summary, details
        );
    }

    throw_write_to_file_failed (source, summary, details) {
        this.throw(
            "Error",
            "Write to file failed.",
            -2146825284,
            "Write to file failed.",
            source, summary, details
        );
    }

    throw_could_not_locate_automation_class (source, summary, details, class_name) {
        this.throw(
            "RangeError",
            `Could not locate automation class named "${class_name}".`,
            -2147352567,
            `Could not locate automation class named "${class_name}".`,
            source, summary, details
        );
    }
}

module.exports = ExceptionHandler;
