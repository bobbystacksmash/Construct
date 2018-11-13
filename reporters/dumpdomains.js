const uri = require("url");

let uris = [];

module.exports = {

    meta: {
        name: "dumpdomains",
        description: "Extracts only the host part (domain name) of all discovered URIs."
    },

    report: (event, done) => {

        if (event.meta === "finished") {
            done(null, uris);
        }

        // TODO: Update this to also try and pull URIs from exec commands, such
        // as PS IEX calls, etc.
        if (event.meta && event.meta === "runtime.api.call") {
            if (/xmlhttp/i.test(event.target) && /^open$/i.test(event.property.normalised)) {

                if (event.args && event.args.length >= 1) {

                    try {
                        let url = uri.parse(event.args[1].value);
                        uris.push(url);
                    }
                    catch (_) {
                    }
                }
            }
        }
    }
};
