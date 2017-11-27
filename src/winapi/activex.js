
/*
 * https://docs.microsoft.com/en-us/scripting/javascript/reference/activexobject-object-javascript
 */

const winevts              = require("../events");
const XMLHttpRequest_API   = require("./xhr");
const ADODB_API            = require("./adodb");
const FileSystemObject_API = require("./fso");
const WshShell_API         = require("./WshShell.js");

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

        // https://msdn.microsoft.com/en-us/library/ms763680(v=vs.85).aspx
        // https://stackoverflow.com/questions/1163045/differences-between-msxml2-serverxmlhttp-and-winhttp-winhttprequest
        case "MSXML2.SERVERXMLHTTP":
        case "MSXML2.XMLHTTP":
            console.info(`[ActiveXObject] Returning new XMLHttpRequest() instance...`);
            let xhr = XMLHttpRequest_API({ emitter: ee });
            return xhr;

        case "SCRIPTING.FILESYSTEMOBJECT":
            console.info(`[ActiveXObject] Returning new File System Object (FSO)...`);
            return FileSystemObjectProxy;

        case "ADODB.STREAM":
            console.info(`[ActiveXObject] Returning new ADODB Stream...`);
            let adodb = ADODB_API({ emitter: ee });
            return adodb;

        case "WSCRIPT.SHELL":
            // https://msdn.microsoft.com/fr-fr/library/aew9yb99(v=vs.84).aspx
            // https://msdn.microsoft.com/fr-fr/library/fd7hxfdd(v=vs.84).aspx
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
