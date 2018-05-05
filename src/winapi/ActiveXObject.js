/*
 * https://docs.microsoft.com/en-us/scripting/javascript/reference/activexobject-object-javascript
 */

const Component       = require("../Component");
const proxify         = require("../proxify2");
const create_instance = require("../winapi/support/create_instance");

class JS_ActiveXObject extends Component {

    constructor (context, type, location) {

	console.log("========================");
	console.log(`new ActiveXObject: ${type}`);
	console.log("========================");

	super(context, `ActiveXObject(${type})`);
	this.ee = this.context.emitter;

        return create_instance(context, type);
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
