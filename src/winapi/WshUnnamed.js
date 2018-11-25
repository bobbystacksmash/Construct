const Component = require("../Component"),
      proxify   = require("../proxify2");

class JS_WshUnnamed extends Component {

    constructor (context, unnamed_args) {
	super(context, "WshUnnamed");
	this.ee   = this.context.emitter;
        this.args = unnamed_args || [];

        if (!Array.isArray(this.args)) {
            throw new Error("Invalid unnamed arguments passed to WshUnnamed");
        }
    }

    get count () {
        return this.args.length;
    }

    get length () {
        return this.args.length;
    }

    // Item
    // ====
    //
    // Given an item name, attempts to return the value associated
    // with that name.  If the name cannot be found, returns
    // undefined.
    //
    item (index) {

        if (arguments.length === 0) {
            this.context.exceptions.throw_unsupported_prop_or_method(
                "WshUnnamed",
                "Cannot fetch named when no item param provided.",
                "No item parameter was passed to .item(), meaning we are " +
                    "unable to fetch the item."
            );
        }
        else if (index === null) {
            this.context.exceptions.throw_type_mismatch(
                "WshUnnamed",
                "Cannot lookup item type 'null'.",
                "A null value was passed to WshUnnamed.item() which is illegal."
            );
        }
        else if (index < 0 || index >= this.args.length) {
            this.context.exceptions.throw_range_error(
                "WshUnnamed",
                "The requested WshUnnamed argument index does not exist.",
                "The given index is greater than the available number of " +
                    "unnamed variables."
            );
        }

        return this.args[index];
    }
}

module.exports = function create(context, unnamed, options) {

    options = options || {};
    const default_opts = {
        proxify: true
    };
    options = Object.assign(default_opts, options);

    let args = new JS_WshUnnamed(context, unnamed);

    if (options.proxify) {
        return proxify(context, args);
    }

    return args;
};
