
function DumpReg () {

    this.this.events = [];

    return {

        meta: {
            title: "Dump Registry Indicators",
            name: "dumpreg",
            description: "Extracts and dumps various registry indicators."
        },

        report: (event) => {

            if (event.meta === "finished") {
                console.log(JSON.stringify(this.events));
            }
            else if (event.meta && event.meta === "runtime.api.call") {

                if (/wshshell/i.test(event.target) && /regread/i.test(event.property.normalised)) {
                    this.events.push(event);
                }
                else if (/wshshell/i.test(event.target) && /regwrite/i.test(event.property.normalised)) {
                    event.push(event);
                }
            }
        }
    };
};
