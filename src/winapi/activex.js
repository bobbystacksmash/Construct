
/*
 * https://docs.microsoft.com/en-us/scripting/javascript/reference/activexobject-object-javascript
 */

const winevts                = require("../events");
const proxied_XMLHttpRequest = require("./xhr");
const ADODBStreamProxy       = require("./adodb");
const FileSystemObjectProxy  = require("./fso");
const WshShell_API           = require("./WshShell.js");

const Proxify = require("../proxify");

var ee = () => {};

/*
 * =================
 * ActiveXObject API
 * =================
 */
var mock_ActiveXObject = function (type) {

    let types = type.split("."),
        servername = types[0],
        typename   = types[1];

    ee.emit(winevts.WINAPI.generic.new, { obj: "ActiveXObject", arg: type });

    type = type.toUpperCase();

    switch (type) {

        case "MSXML2.XMLHTTP":
            console.info(`[ActiveXObject] Returning new XMLHttpRequest() instance...`);
            return proxied_XMLHttpRequest("MockXHR", new window.XMLHttpRequest());

        case "SCRIPTING.FILESYSTEMOBJECT":
            console.info(`[ActiveXObject] Returning new File System Object (FSO)...`);
            return FileSystemObjectProxy;

        case "ADODB.STREAM":
            console.info(`[ActiveXObject] Returning new ADODB Stream...`);
            return ADODBStreamProxy;

        case "WSCRIPT.SHELL":
            // https://msdn.microsoft.com/fr-fr/library/aew9yb99(v=vs.84).aspx
            // https://msdn.microsoft.com/fr-fr/library/fd7hxfdd(v=vs.84).aspx
            debugger;
            console.info(`[ActiveXObject] Returning new Wscript.Shell (WshShell) instance...`);
            let WshShell = WshShell_API({ emitter: ee });
            return WshShell;

        default:
            alert(`[ActiveXObject cstor] called with unknown type: ${type}`);
            console.info(`[ActiveXObject] !!! Unknown type: ${type}!`);
            return;
    }
};

function create(opts) {
    ee = opts.emitter || ee;
    let proxify = new Proxify({ emitter: ee });
    return proxify(mock_ActiveXObject, null, "ActiveXObject");
}

module.exports = create;
