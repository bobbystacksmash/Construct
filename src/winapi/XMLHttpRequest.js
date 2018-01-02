const proxify2 = require("../proxify2");
const events   = require("../events");

//
// https://msdn.microsoft.com/en-us/library/ms757849(v=vs.85).aspx
//

module.exports = function XMLHttpRequest (opts) {

    let ee       = opts.emitter;
    var last_req = {};

    function open(method, url, asyn, user, password) {
        let safeish_url = url.replace(/\./g, "[.]").replace(/^http/i, "hxxp");

        last_req = {
            method      : method,
            url         : url,
            safeish_url : safeish_url,
            asyn        : asyn,
            user        : user,
            password    : password
        };

        ee.emit(events.WINAPI.XMLHttpRequest.open, last_req);

        console.log(`XMLHttpRequest.open(${JSON.stringify(last_req)})`);
    }

    function send () {
        console.log(`XMLHttpRequest.sending: ${JSON.stringify(last_req)}`);
        ee.emit(events.WINAPI.XMLHttpRequest.send, last_req);
    }


    let XMLHttpRequest = {

        responseBody: "X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",
        ResponseBody: "X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",
        ResponseText: "X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",

        status: 200,
        Status: 200,

        open: open,
        Open: open,

        send: send,
        Send: send,

        setRequestHeader: (header, value) => {
            console.log(`XHR.setRequestHeader | ${header}: ${value}`);
        },
    };

    return proxify2(XMLHttpRequest, "XMLHttpRequest", opts);

}
