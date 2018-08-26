module.exports = {

    meta: {
        name: "dumpnet",
        description: "Extracts and dumps various network indicators."
    },

    report: (events) => {

        const net_events = events.reduce((collector, event) => {
            if (event.meta && event.meta === "runtime.api.call") {
                if (/xmlhttp/i.test(event.target)) {

                    if (event.prop === "open") {
                        event.args[1] = encodeURI(event.args[1]);
                    }

                    collector.push(event);
                }
            }

            return collector;
        }, []);

        console.log(JSON.stringify(net_events));
    }
};
