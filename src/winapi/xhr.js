
const winevts = require("../events");
const Proxify = require("../proxify");

/*
 * ==================
 * XMLHttpRequest API
 * ==================
 */



function mock_open (xhr) {
    return (method, url, asyn, user, password) => {
        let new_url = "http://localhost:3000/fetch/" + encodeURIComponent(url);

        ee.emit(winevts.WINAPI.XMLHttpRequest.open, {
            method  : method,
            url     : url,
            async   : asyn,
            user    : user,
            password: password
        });

        return xhr.open(method, new_url, asyn, user, password);
    }
}


function mock_send (xhr) {
    return () => {
        debugger;
        return xhr.send();
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
    return () => {
        return xhr.setRequestHeader(...args);
    }
}


function mock_overrideMimeType (xhr) {
    return () => {
        return xhr.overrideMimeType(...args);
    }
}


function create(opts) {

    ee = opts.emitter || { emit: () => {}, on: () => {} };

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

    ee.emit(winevts.WINAPI.XMLHttpRequest.new);

    var proxify = new Proxify({ emitter: ee });
    return proxify(mock_xhr_api, overrides, "XMLHttpRequest");
}

module.exports = create;
