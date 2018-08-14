module.exports = {

    meta: {
        title: "Dump Execuation Indicators",
        name: "dumpexec",
        description: "Extracts and dumps various execution indicators."
    },

    report: (events) => {

        const exec_events = events.reduce((collector, event) => {
            if (event.meta && event.meta === "runtime.api.call") {
                if (/wshshell/i.test(event.target) && /run/i.test(event.prop)) {
                    collector.push(event);
                }
                else if (/ShellApplication/i.test(event.target) && /shellexecute/i.test(event.prop)) {
                    collector.push(event);
                }
            }

            return collector;
        }, []);

        console.log(JSON.stringify(exec_events));
    }
};
