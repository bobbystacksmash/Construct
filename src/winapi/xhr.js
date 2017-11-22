
const winevts        = require("../events");
const Proxify        = require("../proxify");
const _              = require("lodash");

/*
 * ==================
 * XMLHttpRequest API
 * ==================
 */



function prox_XHR_fn_call (target, ctx, args) {

}


function mock_open (xhr) {
    return (method, url, asyn, user, password) => {
        alert("mock open: " + url);
        //console.info(`${tag} :: XHR.open(${method}, ${url}, ${asyn})`);
        // Translate the URL to something that won't violate CORS:
        let new_url = "http://localhost:3000/fetch/" + encodeURIComponent(url);
        //console.info(`${tag} :: ${url} -> ${new_url}`);
        return xhr.open(method, url, asyn, user, password);
    }
}


function mock_send (xhr) {
    
    return () => {
        debugger;
        alert("mock send: ");
        return xhr.send();
    }
}


function prox_XHR_prop_get (target, key, trap) {

    alert("prox_XHR_prop_get");

    if (typeof target[key] === 'function') {

        console.info(`${tag} :: is a function...`);

        switch (key) {
        case "open":
                mock_open(...args);
                break;

        default:
            return (...args) => {
                console.info(`${tag} :: XHR.${key}(${args})`);
                return target[key](...args);
            };
        }
    }
    else {

        if (key == "Status") key = "status";

        return target[key];
    }
}


function create(opts) {

    ee = opts.emitter || { emit: () => {}, on: () => {} };

    var xhr = new window.XMLHttpRequest();

    var mock_xhr_api = {
        open: mock_open(xhr),
        send: mock_send(xhr)

        // TODO: Add all other props and defs.
    }

    var overrides = {
        get: (target, key) => {

            if (key === "Status") {
                return target["status"];
            }

            return target[key];
        }
    };

    var proxify = new Proxify({ emitter: ee });
    return proxify(mock_xhr_api, overrides, "XMLHttpRequest");
}

module.exports = create;
