const Component     = require("../Component"),

class JS_WshEnvironment extends Component {

    constructor (context, env) {
        super(context, "WshEnvironment");
        this.context = context;
        this.ee      = this.context.emitter;
        this.vfs     = this.context.vfs;

        // throw if env is not: "process", "system", or ...

        env = env.toLowerCase();
        this._variables = this.context.config.environment.variables[env];
    }

    count () {

    }

    item (name) {

    }

    length () {

    }

    remove () {

    }
}
