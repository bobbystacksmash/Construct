/*
 * https://docs.microsoft.com/en-us/scripting/javascript/reference/activexobject-object-javascript
 */

const Component       = require("../Component");
const proxify         = require("../proxify2");
const create_instance = require("../winapi/support/create_instance");

class JS_ActiveXObject extends Component {

    constructor (context, type, location) {

	super(context, `ActiveXObject(${type})`);
        this.__name__ = "ActiveXObject";
	this.ee = this.context.emitter;

        const instance = create_instance(context, type);

        this.ee.emit(`${this.__name__}.new.${type}`, {
            target: this.__name__,
            id: this.__id__,
            type: "new",
            prop: "constructor",
            args: [type, location],
            return: instance.__id__
        });

        return instance;
    };
};


module.exports = function create (context) {

    let activex = class ActiveXObject extends JS_ActiveXObject {
	constructor (type, location) {
	    super(context, type, location);
	}
    };

    return proxify(context, activex);
};
