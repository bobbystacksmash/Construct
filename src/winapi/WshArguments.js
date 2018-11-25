const Component      = require("../Component"),
      proxify        = require("../proxify2"),
      JS_WshNamed    = require("./WshNamed"),
      JS_WshUnnamed  = require("./WshUnnamed");

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
class JS_WshArguments extends Component {

    constructor (context, args) {
	super(context, "WshArguments");
        args = args || [];
        let named   = {},
            unnamed = [];

        args.forEach(arg => {
            if (typeof arg === "string") {
                unnamed.push(arg);
            }
            else {
                named = Object.assign(named, arg);
            }
        });

        this.argobj = {
            named: new JS_WshNamed(context, named),
            unnamed: new JS_WshUnnamed(context, unnamed)
        };

        this.args = args;
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
    get length () {
        let arglen = this.argobj.named.length + this.argobj.unnamed.length;
        return arglen;
    }

    set length (_) {
        this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
            "WshArguments",
            "Cannot assign to read-only property: .length.",
            "The length of the WshArguments object cannot be assigned to."
        );
    }

    get named () {
        return this.argobj.named;
    }

    get unnamed () {
        return this.argobj.unnamed;
    }

    item (n) {

        if (n === undefined) {
            n = 0;
        }

        if (n === null) {
            this.context.exceptions.throw_type_error(
                "WshArguments",
                "Cannot convert null to a valid index.",
                "Passing null to the .item method is not allowed."
            );
        }

        if (arguments.length === 0) {
            this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WshArguments",
                "No index value passed to WshArguments.Item()",
                "In order to fetch an item by index, it must be given an " +
                    "index.  No index supplied."
            );
        }

        if (n >= this.length) {
            this.context.exceptions.throw_subscript_out_of_range(
                "WshArguments",
                "Argument index out of range.",
                `Cannot fetch an argument with index ${n} because ` +
                    "this index is out of range."
            );
        }

        let item = this.args[n];

        if (typeof item === "string") {
            return item;
        }

        const key = Object.keys(item)[0],
              val = item[key];

        return `/${key}:${val}`;
    }

    count () {
        return this.argobj.named.length + this.argobj.unnamed.length;
    }

    showusage () {

    }
}

module.exports = function create(context, args) {

    const default_args = new JS_WshArguments(context, args);

    var wrapper = (function (props) {

        function WshArgsWrapper (index) {
            return default_args.item(index);
        }

        for (let prop in props) {
            WshArgsWrapper[prop] = props[prop];
        }

        Object.defineProperty(WshArgsWrapper, "length", {
            get: function ()  { return default_args.length;     },
            set: function (x) { return default_args.length = x; } // throws.
        });

        Object.defineProperty(WshArgsWrapper, "named", {
            get: function ()  { return default_args.named;     },
            set: function (x) { return default_args.named = x; } // throws.
        });

        Object.defineProperty(WshArgsWrapper, "unnamed", {
            get: function ()  { return default_args.unnamed;     },
            set: function (x) { return default_args.unnamed = x; } // throws.
        });

        return WshArgsWrapper;
    }({
        item: (...args) => default_args.item(...args),
        count: (...args) => default_args.count(...args),
        showusage: (...args) => default_args.showusage(...args),

        __name__: "WshArguments",
        __id__  : default_args.__id__
    }));

    return proxify(context, wrapper);
};
