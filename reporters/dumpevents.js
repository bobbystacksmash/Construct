let events = [];

module.exports = {

    meta: {
        name: "dumpevents",
        description: "Dumps a JSON object containing all captured events."
    },

    report: (event, done) => {

        if (event.meta === "finished") {
            done(null, events);
        }

        events.push(event);
    }
};
