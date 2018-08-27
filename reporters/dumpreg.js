
let events = [];

module.exports = {

    meta: {
        title: "Dump Registry Indicators",
        name: "dumpreg",
        description: "Extracts and dumps various registry indicators."
    },

    report: (event) => {

        if (event.meta === "finished") {
            console.log(JSON.stringify(events));
        }

        if (event.meta && event.meta === "runtime.api.call") {

            if (/wshshell/i.test(event.target) && /regread/i.test(event.prop)) {
                events.push(event);
            }
            else if (/wshshell/i.test(event.target) && /regwrite/i.test(event.prop)) {
                event.push(event);
            }
        }
    }
};
