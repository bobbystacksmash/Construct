
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

                if (/wshshell/i.test(event.target.name) && /regread/i.test(event.property)) {
                    this.events.push(event);
                }
                else if (/wshshell/i.test(event) && /regwrite/i.test(event.property)) {
                    event.push(event);
                }
            }
        }
    };
};

module.exports = DumpReg;
