/*
 * https://docs.microsoft.com/en-us/scripting/javascript/reference/activexobject-object-javascript
 */

const Component       = require("../Component");
const proxify         = require("../proxify2");
const create_instance = require("../winapi/support/create_instance");

class JS_ActiveXObject extends Component {

    constructor (context, type, location) {

	super(context, `ActiveXObject`);

        const apiobj = {
            target:  "ActiveXObject",
            id:      this.__id__,
            hooked:  false,
            type:    "constructor",
            prop:    "new",
            args:    [type, location],
            return:  `instanceOf(${type})`
        };
        context.emitter.emit(`ActiveXObject.new.${type}`, apiobj);

        const instance = create_instance(context, type);
        return instance;
    };
};


module.exports = function create (context) {

    return function ActiveXObject (type, location) {
        const activex = new JS_ActiveXObject(context, type, location);
        return activex;
    };
};
