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
    item (name) {

        if (arguments.length === 0) {
            this.context.exceptions.throw_unsupported_prop_or_method(
                "WshUnnamed",
                "Cannot fetch named when no item param provided.",
                "No item parameter was passed to .item(), meaning we are " +
                    "unable to fetch the item."
            );
        }
        else if (name === null) {
            this.context.exceptions.throw_type_mismatch(
                "WshUnnamed",
                "Cannot lookup item type 'null'.",
                "A null value was passed to WshUnnamed.item() which is illegal."
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

module.exports = function create(context, unnamed) {
    let args = new JS_WshUnnamed(context, unnamed);
    return proxify(context, args);
};
