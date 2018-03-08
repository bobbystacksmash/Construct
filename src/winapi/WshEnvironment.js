const Component = require("../Component");

// https://msdn.microsoft.com/en-gb/library/6s7w15a0(v=vs.84).aspx

/*
 * The WshEnvironment object is a collection of environment variables
 * that is returned by the WshShell object's Environment
 * property. This collection contains the entire set of environment
 * variables (those with names and those without). To retrieve
 * individual environment variables (and their values) from this
 * collection, use the environment variable name as the index.
 */

class JS_WshEnvironment extends Component {

    constructor (context) {
	super(context, "WshEnvironment");
	this.ee = this.context.emitter;
    }

    //
    // PROPERTIES
    // ==========
    //
    
    // MSDN: https://msdn.microsoft.com/en-gb/library/6kz722cz(v=vs.84).aspx
    //
    // SYNOPSIS
    // ========
    //
    // Returns the number of Windows environment variables on the
    // local computer system (the number of items in an Environment
    // collection).
    //
    get length () {
	let num_env_vars = Object.keys(this.context.ENVIRONMENT.Variables).length;
	ee.emit("@WshEnvironment.length", num_env_vars);
	return num_env_vars;
    }


    //
    // METHODS
    // =======
    //

    // MSDN: https://msdn.microsoft.com/en-gb/library/218yba97(v=vs.84).aspx
    //
    // SYNOPSIS
    // ========
    //
    // The Remove method removes environment variables from the
    // following types of environments: PROCESS, USER, SYSTEM, and
    // VOLATILE. Environment variables removed with the Remove method
    // are not removed permanently; they are only removed for the
    // current session.
    //
    // ARGUMENTS
    // =========
    //
    //   - name
    //     String value indicating the name of the environment
    //     variable you want to remove.
    //
    // USAGE
    // =====
    //
    //   var WshShell = WScript.CreateObject("WScript.Shell");
    //   var WshEnv = WshShell.Environment("PROCESS");
    //   WshEnv("TestVar") = "Windows Script Host";
    //   WScript.Echo(WshShell.ExpandEnvironmentStrings("The value of the test variable is: '%TestVar%'"));
    //   WshEnv.Remove("TestVar");
    //   WScript.Echo(WshShell.ExpandEnvironmentStrings("The value of the test variable is: '%TestVar%'"));
    Remove (name) {

	this.ee.emit("@WshEnvironment::Remove", {
	    name: name,
	    env_vars: this.context.ENVIRONMENT.Variables
	});

	try {
	    delete this.context.ENVIRONMENT.Variables[name];
	}
	catch (e) {}
    }


    Item (index) {

	let items = this.context.ENVIRONMENT.Variables;
	this.ee.emit("@WshEnvironment::Item", { index: index, items: [] });
    }

}


module.exports = function create(context) {
    let wshenv = new JS_WshEnvironment(context);
    return wshenv;
};

