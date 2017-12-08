const proxify2 = require("../proxify2");

//
//
// https://msdn.microsoft.com/en-us/library/ms757849(v=vs.85).aspx
module.exports = function XMLHttpRequest (opts) {

    let ee = opts.emitter;

    let XMLHttpRequest = {

        responseBody: "X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",
        ResponseBody: "X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",
        ResponseText: "X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",

        status: 200,

        open: (method, url, asyn, user, password) => {
            let safeish_url = url.replace(/\./g, "[.]").replace(/^http/i, "hxxp");
            console.log(`XHR.open(${method}, ${url})`);
        },

        send: () => {
            console.log("XHR.send()");
        },

        setRequestHeader: (header, value) => {
            console.log(`XHR.setRequestHeader | ${header}: ${value}`);
        },
    };

    return proxify2(XMLHttpRequest, "XMLHttpRequest", opts);

}
