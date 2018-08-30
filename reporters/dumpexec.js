
let exec_events = [];

module.exports = {

    meta: {
        title: "Dump Execuation Indicators",
        name: "dumpexec",
        description: "Extracts and dumps various execution indicators."
    },

    report: (event) => {

        if (event.meta && event.meta === "runtime.api.call") {
            if (/wshshell/i.test(event.target) && /^(?:run|exec)$/i.test(event.prop)) {
                exec_events.push(event);
            }
            else if (/ShellApplication/i.test(event.target) && /shellexecute/i.test(event.prop)) {
                exec_events.push(event);
            }
        }
        else if (event.meta && event.meta === "finished") {
            console.log(JSON.stringify(exec_events));
        }
    }
};
