const Component     = require("../Component");

class JS_WshEnvironment extends Component {

    constructor (context, env) {
        super(context, "WshEnvironment");
        this.context = context;
        this.ee      = this.context.emitter;
        this.vfs     = this.context.vfs;
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

module.exports = JS_WshEnvironment;
