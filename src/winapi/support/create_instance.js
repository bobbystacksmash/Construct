const JScript_XMLHttpRequestBase = require("../XMLHttpRequestBase");
const JScript_WshShell           = require("../WshShell");
const JScript_ShellApplication   = require("../ShellApplication");
const JScript_ADODBStream        = require("../ADODBStream");
const JScript_FileSystemObject   = require("../FileSystemObject");
const JScript_WshNetwork         = require("../WshNetwork");

function create_instance (context, type) {

    type = type.toLowerCase();

    let instance = null;

    switch (type) {

    case "shell.application":
	let shell_application = new JScript_ShellApplication(context);
	instance = shell_application;
        break;

    case "wscript.shell":
	let wsh = new JScript_WshShell(context);
	instance = wsh;
        break;

    case "wscript.network":
        let wnet = new JScript_WshNetwork(context);
        instance = wnet;
        break;

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
	let xhr = new JScript_XMLHttpRequestBase(context, type, "xmlhttprequest");
	instance = xhr;
        break;

    case "adodb.stream":
	let ado = new JScript_ADODBStream(context);
	instance = ado;
        break;

    case "scripting.filesystemobject":
        let fso = new JScript_FileSystemObject(context);
        instance = fso;
        break;

    default:
        throw new Error("Unknown instance type: " + type);
	break;
    }

    context.emitter.emit(
        `runtime.api.method`,
        {
            target: type.replace(".", ""),
            id: instance.__id__,
            hooked: false,
            prop: null,
            args: [],
            type: "constructor",
            return: { target: instance.__name__, id: instance.__id__ }
        }
    );

    return instance;
}

module.exports = create_instance;
