/*
 * https://docs.microsoft.com/en-us/scripting/javascript/reference/activexobject-object-javascript
 */

var proxify2 = require("../proxify2");
var evts     = require("../events");
var WshShell = require("./WshShell");
var ADODBStream = require("./ADODBStream");
var ShellApplication = require("./ShellApplication");
var FileSystemObject = require("./FileSystemObject");
var XMLHttpRequest   = require("./XMLHttpRequest");

function ActiveXObject (opts) {

    var ee      = opts.emitter,
        modules = opts.modules || {},
        activex = proxify2({}, "ActiveXObject", { emitter: ee });

    return function ActiveXObject (type) {

        type = type.toLowerCase();

        switch (type) { 

            case "shell.application":
                ee.emit(evts.WINAPI.ActiveXObject.new.Shell.Application, {});
                var shellapplication = new ShellApplication({ emitter: ee });
                return shellapplication;

            case "wscript.shell":
                ee.emit(evts.WINAPI.ActiveXObject.new.WScript.Shell, {});
                var wshshell = new WshShell({ emitter: ee });
                return wshshell;

            case "scripting.filesystemobject":
                ee.emit(evts.WINAPI.ActiveXObject.new.Scripting.FileSystemObject, {});
                var fso = new FileSystemObject({ emitter: ee });
                return fso;

            case "adodb.stream":
                ee.emit(evts.WINAPI.ActiveXObject.new.ADODB.Stream, {});
                var adodbstream = new ADODBStream({ emitter: ee });
                return adodbstream;

            case "msxml2.serverxmlhttp":
                ee.emit(evts.WINAPI.ActiveXObject.new.MSXML2.ServerXMLHttp, {});
                var xhr = new XMLHttpRequest({ emitter: ee });
                return xhr;

            case "msxml2.xmlhttp":
                ee.emit(evts.WINAPI.ActiveXObject.new.MSXML2.XMLHttp, {});
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
