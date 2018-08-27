let events = [];

module.exports = {

    meta: {
        title: "Dump Filesystem Indicators",
        name: "dumpfs",
        description: "Extracts and dumps various filesystem indicators."
    },

    report: (event) => {

        if (event.meta === "finished") {
            console.log(JSON.stringify(events));
        }
        else if (event.meta && event.meta === "runtime.api.call") {

            if (/^(?:filesystemobject|file|folder)/i.test(event.target)) {
                events.push(event);
            }
        }
    }
};
