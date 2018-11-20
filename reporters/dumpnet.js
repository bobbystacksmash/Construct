
function DumpNet () {

    this.events = [];

    return {

        meta: {
            name: "dumpnet",
            description: "Extracts and dumps various network indicators."
        },

        report: (event, done) => {

            if (event.meta === "finished") {
                done(null, this.events);
            }
            else if (event.meta && event.meta === "runtime.api.call") {
                if (/xmlhttp/i.test(event.target.name)) {

                    if (event.property.normalised === "open") {
                        event.args[1] = encodeURI(event.args[1]);
                    }

                    this.events.push(event);
                }
            }
        }
    };
};

module.exports = DumpNet;
