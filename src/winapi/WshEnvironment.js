const Component  = require("../Component");

// https://msdn.microsoft.com/en-gb/library/6s7w15a0(v=vs.84).aspx

/*
 * The WshEnvironment object is a collection of environment variables
 * that is returned by the WshShell object's Environment
 * property. This collection contains the entire set of environment
 * variables (those with names and those without). To retrieve
 * individual environment variables (and their values) from this
 * collection, use the environment variable name as the index.
 */

function JS_WshEnvironment (context, type) {

    let component = new Component(context, "WshEnvironment");

    this.context = component.context;
    this.ee      = component.context.emitter;

    this.__name__ = "WshEnvironment";

    // Valid types for the Environment variables collection are:
    //
    //  * SYSTEM
    //  * USER
    //
    // It's a case-insensitive search; we up the case of any
    // incoming `type', which matches what Windows does.
    //
    // If we cannot find a match for our given type, we throw.
    //
    if (!type) {
	this.context.exceptions.throw_invalid_fn_arg(
	    `WshEnvironment`,
	    `An undefined value is not a valid environment variable container.`,
	    `Environment variables can be accessed via SYSTEM or USER, and ` +
		`in this instance, we've been given undefined.`);
    }

    type = type.toUpperCase();

    if (type !== "SYSTEM" && type !== "USER") {
	this.context.exceptions.throw_invalid_fn_arg(
	    `WshEnvironment`,
	    `Variable container ${type} is not 'SYSTEM' or 'USER'.`,
	    `Environment variables can be accessed via 'SYSTEM' or 'USER', and ` +
		`in this instance, calling code has requested ${type}, for which ` +
		`we have no environment variables.`);
    }

    let env_vars     = this.context.ENVIRONMENT.Variables[type],
	num_env_vars = Object.keys(env_vars);

    function get_var_by_index (var_name) {

	let ENV_vars      = context.ENVIRONMENT.Variables[type],
	    env_var_value = "",
	    found_var     = false;

	// Does our variable exist?
	if (ENV_vars[var_name]) {
	    env_var_value = ENV_vars[var_name];
	    found_var = true;
	}

	context.emitter.emit("@WshEnvironment::get_var", {
	    env_var_name:  var_name,
	    env_var_value: env_var_value,
	    found_var:     found_var
	});

	return env_var_value;
    };

    get_var_by_index.Length = num_env_vars.length;
    get_var_by_index.Item   = (var_name) => {
	context.emitter.emit("@WshEnvironment::Item", { var_name: var_name });
	return get_var_by_index(var_name);
    };

    return get_var_by_index;
}


module.exports = JS_WshEnvironment;
