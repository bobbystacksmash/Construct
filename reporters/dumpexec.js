
function DumpExec () {

    this.events = [];

    return {

        meta: {
            title: "Dump Execuation Indicators",
            name: "dumpexec",
            description: "Extracts and dumps various execution indicators."
        },

        report: (event, done) => {

            if (event.meta && event.meta === "runtime.api.call") {
                if (/wshshell/i.test(event.target) && /^(?:run|exec)$/i.test(event.property.normalised)) {
                    this.events.push(event.args[0].value);
                }
                else if (/ShellApplication/i.test(event.target) && /shellexecute/i.test(event.property.normalised)) {
                    this.events.push(event.args[0].value);
                }
            }
            else if (event.meta && event.meta === "finished") {
                done(null, this.events);
            }
        }
    };
};

module.exports = DumpExec;
