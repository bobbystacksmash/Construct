let uris = {};

module.exports = {

    meta: {
        name: "dumpuris",
        description: "Extracts and dumps URIs found within the source."
    },

    report: (event) => {

        if (event.meta === "finished") {
            console.log(JSON.stringify(uris));
        }
        else if (event.meta && event.meta === "runtime.api.call") {

            if (/xmlhttp/i.test(event.target) && /^open$/i.test(event.prop)) {

                let method = event.args[0].value.toLowerCase(),
                    uri    = event.args[1].value;

                if (!uris.hasOwnProperty(method)) {
                    uris[method] = {};
                }

                if (!uris[method].hasOwnProperty(uri)) {
                    uris[method][uri] = 0;
                }

                uris[method][uri]++;
            }
        }
    }
};
