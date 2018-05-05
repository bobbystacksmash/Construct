const JScript_XMLHttpRequestBase = require("../XMLHttpRequestBase");
const JScript_WshShell           = require("../WshShell");
const JScript_ShellApplication   = require("../ShellApplication");
const JScript_ADODBStream        = require("../ADODBStream");
const JScript_FileSystemObject   = require("../ADODBStream");

function create_instance (context, type) {

    type = type.toLowerCase();

    switch (type) {

    case "shell.application":
	let shell_application = new JScript_ShellApplication(context);
	return shell_application;

    case "wscript.shell":
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
	let xhr = new JScript_XMLHttpRequestBase(context, type);
	return xhr;

    case "adodb.stream":
	let ado = new JScript_ADODBStream(context);
	return ado;

    case "scripting.filesystemobject":
        let fso = new JScript_FileSystemObject(context);
        return fso;

    default:
        throw new Error("Unknown instance type: " + type);
	break;
    }
}

module.exports = create_instance;
