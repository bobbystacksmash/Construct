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

        let args = [type];
        if (location) args.push(location);

        let apicall = new ObjectInteraction(context, {
            target: { name: "ActiveXObject", id: instance.__id__ },
            property: "new",
            type: ObjectInteraction.TYPE_CONSTRUCTOR,
            args: args,
            retval: instance
        });
        apicall.emit_event(`runtime.api.method`);

        return instance;
    };
};


module.exports = function create (context) {
    return function ActiveXObject (type, location) {
        const activex = new JS_ActiveXObject(context, type, location);
        return activex;
    };
};
