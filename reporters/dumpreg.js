
function DumpReg () {

    this.events = [];

    return {

        meta: {
            title: "Dump Registry Indicators",
            name: "dumpreg",
            description: "Extracts and dumps various registry indicators."
        },

        report: (event, done) => {

            if (event.meta === "finished") {
                done(null, this.events);
            }
            else if (event.meta && event.meta === "runtime.api.call") {

                if (/^wshshell/i.test(event.target.name)) {
                    switch (event.property.toLowerCase()) {
                    case "regread":
                        this.events.push({
                            type: "regread",
                            key: event.args[0].value,
                            value: (!!event.retval) ? event.retval : null
                        });
                        break;

                    case "regwrite":
                        this.events.push({
                            type: "regwrite",
                            key: event.args[0].value,
                            value: event.args[1].value
                        });
                        break;

                    case "regdelete":
                        this.events.push({
                            type: "regdelete",
                            key: event.args[0].value,
                            value: null
                        });
                    }
                }
            }
        }
    };
};

module.exports = DumpReg;
