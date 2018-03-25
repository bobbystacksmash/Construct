/*
 * https://docs.microsoft.com/en-us/scripting/javascript/reference/activexobject-object-javascript
 */

const Component = require("../Component");
const proxify   = require("../proxify2");

const JScript_XMLHttpRequestBase = require("../winapi/XMLHttpRequestBase");
const JScript_WshShell           = require("../winapi/WshShell");
const JScript_ShellApplication   = require("../winapi/ShellApplication");
const JScript_ADODBStream        = require("../winapi/ADODBStream");

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


	case "WbemScripting.SWbemLocator":
	    console.log("TODO: Add WMI Scripting.");
	    break;

	// =================
        // XML HTTP Requests
	// =================
	case "msxml2.serverxmlhttp.6.0":
	case "msxml2.serverxmlhttp":
	case "msxml2.xmlhttp.6.0":
	case "msxml2.xmlhttp.5.0":
	case "msxml2.xmlhttp.4.0":
	case "msxml2.xmlhttp.3.0":
	case "msxml2.xmlhttp":
	case "microsoft.xmlhttp":
	    this.ee.emit("@ActiveXObject::new::MSXML2.XMLHTTP");
	    let xhr = new JScript_XMLHttpRequestBase(context, type);
	    return xhr;

	case "adodb.stream":
	    this.ee.emit("@ActiveXObject::new::ADODB.Stream");
	    let ado = new JScript_ADODBStream(context);
	    return ado;
	    
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
