class ObjectInteraction {

    constructor (obj) {

        obj = Object.assign({
            target:   null,
            property: null,
            id:       null,
            args:     [],
            type:     null,
            retval:   null
        }, obj);

        this._type     = obj.type;
        this._target   = obj.target;
        this._property = obj.property;
        this._id       = obj.id;
        this.args      = obj.args;
        this._retval   = obj.retval;
    }

    event () {
        return {
            target:   this._target,
            type:     this._type,
            property: this._property,
            args:     this._args,
            retval:   this._retval
        };
    }

    // The `target' is an instance of a WINAPI object, such as
    // WshEnvironment, or XMLHttpRequest, etc.
    set target (T) {
        if (T && T.hasOwnProperty("__name__")) {
            this._target = T.__name__.replace(/\./g, "").toLowerCase();
        }
    }


    // The `property' is the method, getter, or setter name associated
    // with a target, for example:
    //
    //   xmlhttprequest.open()
    //
    //   TARGET:   `xmlhttprequest'
    //   PROPERTY: `open`
    //
    set property (original_property) {

        if (!original_property) return;

        this._property = original_property;
    }

    // Args are the arguments either passed to a method, or assigned
    // to a property.
    set args (args) {

        if (args === undefined) return [];

        args = (Array.isArray(args)) ? args : [args];
        this._args = args.map(arg => {
            return {
                type:  typeof arg,
                value: arg
            };
        });
    }

    // Type is used to identify the type of property that's being
    // accessed.  See static methods `TYPE_{METHOD,GETTER,SETTER}' for
    // valid types.
    set type (T) {
        this._type = T;
    }

    // The return value as-returned from accessing the property or
    // method.
    set retval (retval) {

        if (retval && typeof retval === "object") {
            retval = {
                target : retval.__name__,
                id     : retval.__id__
            };
        }

        this._retval = retval;
    }

    static get TYPE_CONSTRUCTOR () {
        return "constructor";
    }

    static get TYPE_METHOD () {
        return "method";
    }

    static get TYPE_GETTER () {
        return "getter";
    }

    static get TYPE_SETTER () {
        return "setter";
    }
}

module.exports = ObjectInteraction;
