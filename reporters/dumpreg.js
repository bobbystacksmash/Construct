module.exports = {

    meta: {
        title: "Dump Registry Indicators",
        name: "dumpreg",
        description: "Extracts and dumps various registry indicators."
    },

    report: (events) => {

        const reg_events = events.reduce((collector, event) => {

            if (event.meta && event.meta === "runtime.api.call") {

                if (/wshshell/i.test(event.target) && /regread/i.test(event.prop)) {
                    collector.push(event);
                }
                else if (/wshshell/i.test(event.target) && /regwrite/i.test(event.prop)) {
                    collector.push(event);
                }
            }

            return collector;
        }, []);

        console.log(JSON.stringify(reg_events));
    }
};
