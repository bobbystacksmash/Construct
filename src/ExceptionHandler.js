
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
	    // Construct informational properties
	    _source:      _source,
	    _summary:     _summary,
	    _description: _description
	};

	this.ee.emit(`!Exception::${name}`, throw_obj);
	throw throw_obj;
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
}

module.exports = ExceptionHandler;
