const Component    = require("../Component"),
      proxify      = require("../proxify2"),
      JS_WshRemote = require("./WshRemote");

class JS_WshController extends Component {

    constructor (context) {
        super(context, "WshController");
        this.context = context;
    }

    createscript (command_line, remote_machine_name) {

        // TODO: in the future we'll probably add this properly, but
        // for now, let's assume it's disabled.

        if (command_line && !remote_machine_name) {
            this.context.exceptions.throw_automation_srv_cant_create_obj(
                "WshController",
                "Cannot create a remote object - not supported",
                "This feature is not yet supported."
            );
        }

        if (remote_machine_name) {
            this.context.exceptions.throw_remote_machine_unavailable(
                "WshController",
                "Cannot connect to a remote machine - feature not supported.",
                "This feature is not currently supported.  As a result, an " +
                    "exception is thrown."
            );
        }
    }
}

module.exports = function create(context) {
    let controller = new JS_WshController(context);
    return proxify(controller);
};
