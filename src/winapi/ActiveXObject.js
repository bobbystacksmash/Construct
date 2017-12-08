/*
 * https://docs.microsoft.com/en-us/scripting/javascript/reference/activexobject-object-javascript
 */

const proxify2 = require("../proxify2");
const evts     = require("../events");

function ActiveXObject (opts) {

    let ee      = opts.emitter,
        modules = opts.modules || {},
        activex = proxify2({}, "ActiveXObject", { emitter: ee });

    return function ActiveXObject (type) {

        type = type.toLowerCase();

        switch (type) { 

            case "wscript.shell":
                ee.emit(evts.WINAPI.ActiveXObject.new.WScript.Shell, {});
                return modules.WshShell;
                break;

            case "adodb.stream":
                ee.emit(evts.WINAPI.ActiveXObject.new.ADODB.Stream, {});
                return modules.ADODBStream;

            case "msxml2.serverxmlhttp":
                ee.emit(evts.WINAPI.ActiveXObject.new.MSXML2.ServerXMLHttp, {});
                return modules.XMLHttpRequest;

            case "msxml2.xmlhttp":
                debugger;
                ee.emit(evts.WINAPI.ActiveXObject.new.MSXML2.XMLHttp, {});
                return modules.XMLHttpRequest;

            default:
                console.log("[ERROR] ActiveXObject does not know how to create a: " + type);
                throw 42;
                break;
        }

        return {};
    };
}


module.exports = ActiveXObject;
