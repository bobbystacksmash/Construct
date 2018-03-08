/*
 * https://docs.microsoft.com/en-us/scripting/javascript/reference/activexobject-object-javascript
 */

const Component = require("../Component");

//const JScript_WScript          = require("../winapi/WScript");
const JScript_WshShell         = require("../winapi/WshShell");
const JScript_ShellApplication = require("../winapi/ShellApplication");


class JS_ActiveXObject extends Component {

    constructor (context, type, location) {

	console.log("========================");
	console.log(`new ActiveXObject: ${type}`);
	console.log("========================");

	super(context);
	this.ee = this.context.emitter;
	
	type = type.toLowerCase();

	switch (type) {

	case "shell.application":
	    this.ee.emit("@ActiveXObject::new::Shell.Application");
	    let shell_application = new JScript_ShellApplication(context);
	    return shell_application;

	case "wscript.shell":
	    this.ee.emit("@ActiveXObject::new::WScript.Shell");
	    return new JScript_WshShell(context);


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

    return activex;
};






/*
var proxify2 = require("../proxify2");
var evts     = require("../events");
var WshShell = require("./WshShell");
var ADODBStream = require("./ADODBStream");
var ShellApplication = require("./ShellApplication");
var FileSystemObject = require("./FileSystemObject");
var XMLHttpRequest   = require("./XMLHttpRequest");

function AActiveXObject (opts) {

    var ee      = opts.emitter,
        modules = opts.modules || {},
        activex = proxify2({}, "ActiveXObject", { emitter: ee });

    return function ActiveXObject (type) {

        let orig_type = type;

        type = orig_type.toLowerCase();

        switch (type) { 

            case "shell.application":
                ee.emit(evts.WINAPI.ActiveXObject.new.Shell.Application, { type: orig_type });
                var shellapplication = new ShellApplication({ emitter: ee });
                return shellapplication;

            case "wscript.shell":
                ee.emit(evts.WINAPI.ActiveXObject.new.WScript.Shell, { type: orig_type });
                var wshshell = new WshShell({ emitter: ee });
                return wshshell;

            case "scripting.filesystemobject":
                ee.emit(evts.WINAPI.ActiveXObject.new.Scripting.FileSystemObject, { type: orig_type });
                var fso = new FileSystemObject({ emitter: ee });
                return fso;

            case "adodb.stream":
                ee.emit(evts.WINAPI.ActiveXObject.new.ADODB.Stream, { type: orig_type });
                var adodbstream = new ADODBStream({ emitter: ee });
                return adodbstream;

            case "msxml2.serverxmlhttp":
                ee.emit(evts.WINAPI.ActiveXObject.new.MSXML2.ServerXMLHttp, { type: orig_type });
                var xhr = new XMLHttpRequest({ emitter: ee });
                return xhr;

            case "msxml2.xmlhttp":
                ee.emit(evts.WINAPI.ActiveXObject.new.MSXML2.XMLHttp, { type: orig_type });
                var xhr = new XMLHttpRequest({ emitter: ee });
                return xhr;

            default:
                console.log("[ERROR] ActiveXObject does not know how to create a: " + type);
                throw 42;
                break;
        }

        return {};
    };
}


module.exports = ActiveXObject;
*/
