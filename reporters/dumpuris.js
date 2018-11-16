function DumpURIs() {

    this.events = [];

    return {
        meta: {
            name: "dumpuris",
            description: "Extracts and dumps URIs found within the source."
        },

        report: (event, done) => {

            if (!event.property) {
                console.log("#######################################");
                console.log("#######################################");
                console.log("#######################################");
                console.log(JSON.stringify(event, null, 2));
                console.log("#######################################");
                console.log("#######################################");
                console.log("#######################################");
                process.exit();
            }

            if (event.meta === "finished") {
                done(null, this.events);
            }
            else if (event.meta && event.meta === "runtime.api.call") {

                if (/xmlhttp/i.test(event.target) && /^open$/i.test(event.property.normalised)) {

                    let method = event.args[0].value.toLowerCase(),
                        uri    = event.args[1].value;

                    if (!this.events.hasOwnProperty(method)) {
                        this.events[method] = {};
                    }

                    if (!this.events[method].hasOwnProperty(uri)) {
                        this.events[method][uri] = 0;
                    }

                    this.events[method][uri]++;
                }
            }
        }
    };
};

module.exports = DumpURIs;
