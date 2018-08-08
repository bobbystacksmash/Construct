const Component = require("../Component"),
      proxify   = require("../proxify2");

class JS_WshNamed extends Component {

    constructor (context, named_args) {
	super(context, "WshNamed");
	this.ee   = this.context.emitter;
        this.args = named_args || {};
    }

    get count () {
        return Object.keys(this.args).length;
    }

    get length () {
        return Object.keys(this.args).length;
    }

    // Exists
    // ======
    //
    // Performs a case-insensitive match against the name part of each
    // named param in the collection, returning TRUE if exists, or
    // FALSE if not.
    //
    exists (prop) {

        if (prop === null) {
            this.context.exceptions.throw_type_mismatch(
                "WshNamed",
                "Cannot test named param 'null'.",
                "The use of 'null' is not valid when testing for the existance " +
                    "of a named parameter."
            );
        }

        return Object.keys(this.args).some(
            name => name.toLowerCase() === prop.toLowerCase()
        );
    }

    // Item
    // ====
    //
    // Given an item name, attempts to return the value associated
    // with that name.  If the name cannot be found, returns
    // undefined.
    //
    item (name) {

        if (arguments.length === 0) {
            this.context.exceptions.throw_unsupported_prop_or_method(
                "WshNamed",
                "Cannot fetch named when no item param provided.",
                "No item parameter was passed to .item(), meaning we are " +
                    "unable to fetch the item."
            );
        }
        else if (name === null) {
            this.context.exceptions.throw_type_mismatch(
                "WshNamed",
                "Cannot lookup item type 'null'.",
                "A null value was passed to WshNamed.item() which is illegal."
            );
        }

        let item =  Object.keys(this.args).find(arg => {
            return name.toLowerCase() === arg.toLowerCase();
        });

        if (item) {
            return this.args[item];
        }
        else {
            return undefined;
        }
    }
}

module.exports = function create(context, named) {
    let args = new JS_WshNamed(context, named);
    return proxify(context, args);
};
