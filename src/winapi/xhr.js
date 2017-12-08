
// https://msdn.microsoft.com/en-us/library/ms757849(v=vs.85).aspx

const winevts = require("../events");
const Proxify = require("../proxify");

/*
 * ==================
 * XMLHttpRequest API
 * ==================
 */



function mock_open (xhr) {
    return (method, url, asyn, user, password) => {
        let new_url     = "http://localhost:3000/fetch/" + encodeURIComponent(url),
            safeish_url = url.replace(/\./g, "[.]").replace(/^http/i, "hxxp");

        console.log(`XMLHttpRequest.open(${method}, ${safeish_url})`);

        ee.winapi(winevts.WINAPI.XMLHttpRequest.open, {
            args: {
                method: method,
                url: url,
                asyn: asyn,
                user: user,
                password: password
            },
            desc: `xhr.open(${method}, ${safeish_url})`
        });

        return xhr.open(method, new_url, asyn, user, password);
    }
}


function mock_send (xhr) {
    return (body) => {
        console.log("XMLHttpRequest.Sending...");
        xhr.send(body);
    }
}


function mock_abort (xhr) {
    return () => {
        return xhr.abort(...args);
    };
}


function mock_getAllResponseHeaders (xhr) {
    return () => {
        return xhr.getAllResponseHeaders(...args);
    };
}


function mock_getResponseHeader (xhr) {
    return () => {
        return xhr.getResponseHeader(...args);
    }
}


function mock_setRequestHeader (xhr) {
    return (header, value) => {
        console.log(`XMLHttpRequest.setRequestHeader(${header}, ${value})`);
        return xhr.setRequestHeader(...args);
    }
}


function mock_overrideMimeType (xhr) {
    return () => {
        return xhr.overrideMimeType(...args);
    }
}


function create(opts) {

    ee = opts.emitter || { 
        emit:     () => {}, 
        on:       () => {}, 
        onwinapi: () => {}, 
        winapi:   () => {} 
    };

    var XMLHttpRequest = opts.XMLHttpRequest || window.XMLHttpRequest,
        xhr            = new XMLHttpRequest();

    var mock_xhr_api = {
    
        // PROPERTIES
        // ==========
        onreadystatechange: null,
        readyState: null,
        responseXML: null,
        timeout: null,
        upload: null,
        withCredentials: null,
        status: 200,
        ResponseBody: "Snakes on a plane", // TODO!

        // METHODS
        // =======
        open: mock_open(xhr),
        send: mock_send(xhr),
        abort: mock_abort(xhr),
        getAllResponseHeaders: mock_getAllResponseHeaders(xhr),
        getResponseHeader: mock_getResponseHeader(xhr),
        overrideMimeType: mock_overrideMimeType(xhr),
        setRequestHeader: mock_setRequestHeader(xhr),
    };

    var overrides = {
        get: (target, key) => {

            if (key == "ResponseBody") {
                return xhr.responseText;
            }

            return target[key];
        }
    };

    ee.winapi(winevts.WINAPI.XMLHttpRequest.new, "new XMLHttpRequest()");

    var proxify = new Proxify({ emitter: ee });
    return proxify(mock_xhr_api, overrides, "XMLHttpRequest");
}

module.exports = create;
