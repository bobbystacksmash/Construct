let events = [];

module.exports = {

    meta: {
        name: "dumpnet",
        description: "Extracts and dumps various network indicators."
    },

    report: (event, done) => {

        if (event.meta === "finished") {
            done(null, events);
        }
        else if (event.meta && event.meta === "runtime.api.call") {
            if (/xmlhttp/i.test(event.target)) {

                if (event.property.normalised === "open") {
                    event.args[1] = encodeURI(event.args[1]);
                }

                events.push(event);
            }
        }
    }
};
