const proxify2 = require("./proxify2");

const WScript        = require("./winapi/WScript");
const WshShell       = require("./winapi/WshShell");
const TextStream     = require("./winapi/TextStream");
const ActiveXObject  = require("./winapi/ActiveXObject");
const XMLHttpRequest = require("./winapi/XMLHttpRequest");
const ADODBStream    = require("./winapi/adodb");

function WINAPI (opts) {

    let wscript        = new WScript(opts),
        wshshell       = new WshShell(opts),
        adodbstream    = new ADODBStream(opts),
        textstream     = new TextStream(opts),
        xmlhttprequest = new XMLHttpRequest(opts),
        activex        = new ActiveXObject({
            emitter: opts.emitter,
            modules: {
                WScript: wscript,
                WshShell: wshshell,
                ADODBStream: adodbstream,
                XMLHttpRequest: xmlhttprequest,
            }
        });

    debugger;

    return {
        WScript:        wscript,
        ActiveXObject:  activex,
        TextStream: textstream,
        XMLHttpRequest: xmlhttprequest,
    }
};

module.exports = WINAPI;
