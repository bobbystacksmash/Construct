/*
 * https://docs.microsoft.com/en-us/scripting/javascript/reference/activexobject-object-javascript
 */

const Component       = require("../Component");
const proxify         = require("../proxify2");
const create_instance = require("../winapi/support/create_instance");

class JS_ActiveXObject extends Component {

    constructor (context, type, location) {

	super(context, `ActiveXObject`);


        const instance = create_instance(context, type);

        const apiobj = {
            target:  "ActiveXObject",
            id:      this.__id__,
            hooked:  false,
            type:    "constructor",
            prop:    "new",
            args:    [{ type: typeof type, value: type }, { type: typeof location, value: location }],
            return:  { instance: type, id: instance.__id__ }
        };
        context.emitter.emit(`runtime.api.constructor`, apiobj);

        return instance;
    };
};


module.exports = function create (context) {
    return function ActiveXObject (type, location) {
        const activex = new JS_ActiveXObject(context, type, location);
        return activex;
    };
};
