const Component = require("../Component");

// MSDN: https://msdn.microsoft.com/en-us/subscriptions/ss1ysb2a(v=vs.84).aspx
//
// SYNOPSIS
// ========
//
// The WshArguments object is a collection returned by the WScript
// object's Arguments property (WScript.Arguments). Two of the
// WshArguments object's properties are filtered collections of
// arguments — one contains the named arguments (querying this
// property returns a WshNamed object), the other contains the
// unnamed arguments (querying this property returns a WshUnnamed
// object). There are three ways to access sets of command-line
// arguments.
//
//   1. You can access the entire set of arguments (those with and
//      without names) with the WshArguments object.
//
//   2. You can access the arguments that have names with the WshNamed
//      object.
//
//   3. You can access the arguments that have no names with the
//      WshUnnamed object.
//
class WshArguments extends Component {

    constructor (context) {
	super(context, "WshArguments");
	this.ee   = this.context.emitter;
	this.args = this.context.ENVIRONMENT.Arguments;
    }

    // MSDN: https://msdn.microsoft.com/en-us/subscriptions/zz1z71z6(v=vs.84).aspx
    //
    // SYNOPSIS
    // ========
    //
    // Returns the number of command-line parameters belonging to a
    // script (the number of items in an argument's collection).
    //
    // The length property is a read-only integer that you use in
    // scripts when you write in JScript. It is similar to VBScript's
    // Count method.
    //
    get Length () {
	let len = this.args.length;
	this.ee.emit("@WshArguments.Length", { length: len });
	return len;
    }

    
    get Named () {

    }

    get Unnamed () {

    }
    

    Item (n) {

	try {
	    var arg = this.args[n];
	    this.ee.emit("@WshArguments::Item", { index: n, value: arg });
	    return arg;
	}
	catch (e) {
	    this.ee.emit("@WshArguments::Item", { index: n, value: undefined });
	    return undefined;
	}
    }

    
    Count () {

    }

    ShowUsage () {

    }

}

