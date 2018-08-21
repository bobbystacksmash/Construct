module.exports = {

    meta: {
        title: "Dump all captured events",
        name: "dumpevents",
        description: "Dumps a JSON object containing all captured events."
    },

    report: (events) => {
        console.log(JSON.stringify(events, null, 2));
    }
};
