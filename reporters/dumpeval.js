
function DumpEval () {

    this.events = [];

    return {
        meta: {
            title: "Dump code passed to 'eval' and 'Function'.",
            name: "dumpeval",
            description: "Dumps code which was dynamically evaluated at runtime."
        },

        report: (event, done) => {

            if (event.meta === "finished") {
                done(null, this.events);
            }
            else if (event.meta && event.meta.startsWith("runtime.capture")) {
                this.events.push(event);
            }
        }
    };
};

module.exports = DumpEval;
