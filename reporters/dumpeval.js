module.exports = {

    meta: {
        title: "Dump code passed to 'eval' and 'Function'.",
        name: "dumpeval",
        description: "Dumps code which was dynamically evaluated at runtime."
    },

    report: (events) => {

        const eval_events = events.reduce((collector, event) => {

            if (event.meta && event.meta.startsWith("runtime.capture")) {
                collector.push(event);
            }

            return collector;
        }, []);

        console.log(JSON.stringify(eval_events));
    }
};
