let events = [];

module.exports = {

    meta: {
        title: "Dump code passed to 'eval' and 'Function'.",
        name: "dumpeval",
        description: "Dumps code which was dynamically evaluated at runtime."
    },

    report: (event) => {

        if (event.meta === "finished") {
            console.log(JSON.stringify(events));
            return;
        }
        else if (event.meta && event.meta.startsWith("runtime.capture")) {
            events.push(event);
        }
    }
};
