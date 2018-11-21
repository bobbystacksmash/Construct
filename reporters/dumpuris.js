function DumpURIs() {

    this.uris = {};

    return {
        meta: {
            name: "dumpuris",
            description: "Extracts and dumps URIs found within the source."
        },

        report: (event, done) => {

            if (event.meta === "finished") {
                done(null, this.uris);
            }
            else if (event.meta && event.meta === "runtime.api.call") {

                if (/xmlhttp/i.test(event.target.name) && /^open$/i.test(event.property)) {

                    if (event.args.length < 2) return;

                    let method = event.args[0].value.toLowerCase(),
                        uri    = event.args[1].value;

                    if (!this.uris.hasOwnProperty(method)) {
                        this.uris[method] = {};
                    }

                    if (!this.uris[method].hasOwnProperty(uri)) {
                        this.uris[method][uri] = 0;
                    }

                    this.uris[method][uri]++;
                }
            }
        }
    };
};

module.exports = DumpURIs;
