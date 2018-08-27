const Component = require("../Component");

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

        this._vars = this.context.config.environment.variables[env.toLowerCase()];
    }

    count () {
        return Object.keys(this._vars).length;
    }

    item (name) {

    }

    length () {

    }

    remove () {

    }
}

module.exports = JS_WshEnvironment;
