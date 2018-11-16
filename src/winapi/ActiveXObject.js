/*
 * https://docs.microsoft.com/en-us/scripting/javascript/reference/activexobject-object-javascript
 */

const Component         = require("../Component"),
      ObjectInteraction = require("../ObjectInteraction"),
      proxify           = require("../proxify2"),
      create_instance   = require("../winapi/support/create_instance");

class JS_ActiveXObject extends Component {

    constructor (context, type, location) {

	super(context, `ActiveXObject`);

        const instance = create_instance(context, type);

        let apicall = new ObjectInteraction({
            target: "ActiveXObject",
            property: "new",
            id: this.__id__,
            type: ObjectInteraction.TYPE_CONSTRUCTOR,
            args: [type, location],
            retval: { instance: type, id: instance.__id__ }
        });
        context.emitter.emit(`runtime.api.method`, apicall.event());

        return instance;
    };
};


module.exports = function create (context) {
    return function ActiveXObject (type, location) {
        const activex = new JS_ActiveXObject(context, type, location);
        return activex;
    };
};
