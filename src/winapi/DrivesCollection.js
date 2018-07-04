const Component     = require("../Component");
const proxify       = require("../proxify2");
const DriveObject    = require("./DriveObject");

class JS_DrivesCollection extends Component {

    constructor(context) {

	super(context, "DrivesCollection");
	this.context = context;

        this.ee  = this.context.emitter;
        this.vfs = this.context.vfs;
    }

    // HARD CODED: just return '1' - as we only support C:.
    get count () {
        this.ee.emit("DrivesCollection.Count");
        return 1;
    }

    set count (_) {
        this.ee.emit("DrivesCollection.Count");
        this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
            "DrivesCollection",
            "Attempted to assign to read-only '.count' property.",
            "The '.count' property is read-only and cannot be assigned to."
        );
    }

    item (name) {
        this.ee.emit("DrivesCollection.Item");

        if (typeof name !== "string") {
            this.context.exceptions.throw_invalid_fn_arg(
                "DrivesCollection",
                "Argument passed to DrivesCollection.Item is not a string.",
                "The DrivesCollection.Item method will only return files by their " +
                    "string name (not the ordinal position).  Ensure that only " +
                    "strings are passed to .Item."
            );
        }

        name = name.toLowerCase();

        if (name === "c"  || name === "c:" || name === "c:\\" || name === "c:/") {
            return new DriveObject(this.context);
        }

        if (/^[abd-z]:?/i.test(name) || /^[abd-z]:[\\/]$/i.test(name)) {
            this.context.exceptions.throw_device_unavailable(
                "DrivesCollection",
                "The drive cannot be found.",
                `The requested drive (${name}) cannot be found.`
            );
        }

        this.context.exceptions.throw_invalid_fn_arg(
            "DrivesCollection",
            "Drivespec not found.",
            "Unable to find the drivespec requested: " + name
        );
    }
}

module.exports = function create(context, path) {
    let drives_collection = new JS_DrivesCollection(context);
    return proxify(context, drives_collection);
};
