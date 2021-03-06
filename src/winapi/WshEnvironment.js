const Component = require("../Component"),
      proxify   = require("../proxify2"),
      ObjectInteraction = require("../ObjectInteraction");

class JS_WshEnvironment extends Component {

    constructor (context, env) {
        super(context, "WshEnvironment");

        this.context = context;
        this.ee      = this.context.emitter;
        this.vfs     = this.context.vfs;

        if (/^(?:process|system|user)$/i.test(env) === false) {
            this.context.exceptions.throw_invalid_fn_arg(
                "WshEnvironment",
                `Cannot get variables for WshEnvironment type: '${env}'.`,
                "Supported environment collections are: SYSTEM, PROCESS, and USER.  " +
                    "Any other environment string will cause this exception to be thrown."
            );
        }

        this._vars = Object.assign(
            {},
            this.context.config.environment.variables[env.toLowerCase()]
        );
    }

    count () {

        if (this._vars) {
            return Object.keys(this._vars).length;
        }
        else {
            return 0;
        }
    }

    item (name) {

        if (name === undefined) return "";

        if (typeof name !== "string") {
            this.context.exceptions.throw_invalid_fn_arg(
                "WshEnvironment",
                "Invalid argument to 'Item()'.",
                "The 'Item()' method only accepts strings.  The value passed to it " +
                    "which caused this exception was: " + typeof name + ", which is invalid."
            );
        }

        let var_value = Object.keys(this._vars).find(key => key.toLowerCase() === name.toLowerCase());
        if (var_value) {
            return this._vars[var_value];
        }

        return "";
    }

    get length () {
        if (this._vars) {
            return Object.keys(this._vars).length;
        }
        else {
            return 0;
        }
    }

    set length (_) {
        this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
            "WshEnvironment",
            "Cannot assign a value to the .length property.",
            "The .Length property does not support being assigned-to."
        );
    }

    remove (name) {

        if (name === "") {
            this.context.exceptions.throw_cannot_remove_environment_var(
                "WshEnvironment",
                "Cannot remove env var: \"\".",
                "The empty environment variable (\"\") cannot be removed."
            );
        }
        else if (typeof name === "boolean") {
            return;
        }

        name = name.toLowerCase();

        if (this._vars.hasOwnProperty(name)) {
            delete this._vars[name];
        }
    }
}


module.exports = function create(context, type) {

    const default_env = new JS_WshEnvironment(context, (type) ? type : "SYSTEM");

    var wrapper = (function (props) {

        function WshEnvWrapper (type) {

            let apicall = new ObjectInteraction(context, {
                target: {
                    name: default_env.__name__,
                    id: default_env.__id__
                },
                type: ObjectInteraction.TYPE_METHOD,
                property: "ENVIRONMENT",
                retval: { __name__: "WshEnvironment", __id__: default_env.__id__ },
                args: type
            });
            apicall.emit_event(`runtime.api.call`);

            let callable = function (var_name) {

                let var_value = default_env.item(var_name);

                let apicall = new ObjectInteraction(context, {
                    target: {
                        name:default_env.__name__,
                        id: default_env.__id__
                    },
                    property: "item",
                    type: ObjectInteraction.TYPE_METHOD,
                    args: [var_name],
                    retval: var_value
                });

                apicall.emit_event(`runtime.api.call`);

                return var_value;
            };

            for (let prop in props) {
                callable[prop] = props[prop];
            }

            Object.defineProperty(WshEnvWrapper, "length", {
                get: function ()  { return default_env.length; },
                set: function (x) { return default_env.length = x; }
            });

            return callable;
        };

        for (let prop in props) {
            WshEnvWrapper[prop] = props[prop];
        }

        Object.defineProperty(WshEnvWrapper, "length", {
            get: function ()  { return default_env.length; },
            set: function (x) { return default_env.length = x; }
        });

        return WshEnvWrapper;
    }({
        count:  (...args) => default_env.count(...args),
        remove: (...args) => default_env.remove(...args),
        item:   (...args) => default_env.item(...args),

        __name__: "WshEnvironment",
        __id__:   default_env.__id__
    }));

    return proxify(context, wrapper);
};
