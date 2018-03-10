
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

    _throw (source, type, name, message, summary, detailed) {
	
	if (!summary)  this._lazy_throw_protect(type, "Summary is not defined.");
	if (!detailed) this._lazy_throw_protect(type, "Detailed description is not defined.");

	let throw_obj = { 
	    name: name,
	    source: source,
	    message: message,
	    summary: summary,
	    detailed: detailed
	};

	console.log(throw_obj);

	this.ee.emit(`!Exception::${type}`, throw_obj);
	throw throw_obj;
    }

    
    throw_path_not_found (source, summary, detailed) {
	this._throw(source,
	       "path_not_found",
	       "Error",
	       "Path not found",
	       summary,
	       detailed);
    }


    throw_invalid_fn_arg (source, summary, detailed) {
	this._throw(source,
	       "invalid_fn_arg",
	       "TypeError",
	       "Invalid procedure call or argument",
	       summary,
	       detailed);
    }


    throw_unsupported_prop_or_method (source, summary, detailed) {
	this._throw(source,
		    "unsupported_prop_or_method",
		    "TypeError",
		    "Object doesn't support this property or method",
		    summary,
		    detailed);
    }
}

module.exports = ExceptionHandler;
