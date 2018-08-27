let events = [];

module.exports = {

    meta: {
        title: "Dump all captured events",
        name: "dumpevents",
        description: "Dumps a JSON object containing all captured events."
    },

    report: (event) => {

        if (event.meta !== "finished") {
            events.push(event);
        }
        else {
            console.log(JSON.stringify(events, null, 2));
        }
    }
};
