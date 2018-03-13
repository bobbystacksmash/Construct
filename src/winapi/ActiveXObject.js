/*
 * https://docs.microsoft.com/en-us/scripting/javascript/reference/activexobject-object-javascript
 */

const Component = require("../Component");
const proxify   = require("../proxify2");


const JScript_MSXML2XMLHTTP    = require("../winapi/MSXML2_XMLHTTP");
const JScript_WshShell         = require("../winapi/WshShell");
const JScript_ShellApplication = require("../winapi/ShellApplication");


class JS_ActiveXObject extends Component {

    constructor (context, type, location) {

	type = type.toLowerCase();
	
	console.log("========================");
	console.log(`new ActiveXObject: ${type}`);
	console.log("========================");

	super(context, `ActiveXObject(${type})`);
	this.ee = this.context.emitter;
	
	switch (type) {

	case "shell.application":
	    this.ee.emit("@ActiveXObject::new::Shell.Application");
	    let shell_application = new JScript_ShellApplication(context);
	    return shell_application;

	case "wscript.shell":
	    this.ee.emit("@ActiveXObject::new::WScript.Shell");
	    let wsh = new JScript_WshShell(context);
	    return wsh;

	case "msxml2.xmlhttp":
	    this.ee.emit("@ActiveXObject::new::MSXML2.XMLHTTP");
	    let xhr = new JScript_MSXML2XMLHTTP(context);
	    return xhr;


	default:
	    console.log("ERROR: Unknown action type for ActiveXObject: " + type);
	    break;
	}
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
