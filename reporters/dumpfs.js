module.exports = {

    meta: {
        title: "Dump Filesystem Indicators",
        name: "dumpfs",
        description: "Extracts and dumps various filesystem indicators."
    },

    report: (events) => {

        const fs_events = events.reduce((collector, event) => {

            if (event.meta && event.meta === "runtime.api.call") {

                if (/^(?:filesystemobject|file|folder)/i.test(event.target)) {
                    collector.push(event);
                }
            }

            return collector;
        }, []);

        console.log(JSON.stringify(fs_events));
    }
};
