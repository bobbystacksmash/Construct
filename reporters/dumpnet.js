
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
                return;
            }
            else if (event.meta && event.meta === "runtime.api.call") {
                if (/xmlhttp/i.test(event.target.name)) {

                    if (event.property === "open") {

                        let request_type = event.args[0].value;

                        if (!request_type) {
                            request_type = "UNKNOWN";
                        }
                        else if (event.args.length < 2) {
                            return;
                        }
                        else {
                            request_type = request_type.toUpperCase();
                        }

                        let obj = {};
                        obj[request_type] = encodeURI(event.args[1].value);
                        this.events.push(obj);
                    }
                }
            }
        }
    };
};

module.exports = DumpNet;
