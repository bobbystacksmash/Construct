
function DumpExec () {

    this.events = [];

    return {

        meta: {
            title: "Dump Execuation Indicators",
            name: "dumpexec",
            description: "Extracts and dumps various execution indicators."
        },

        report: (event, done) => {

            if (event.meta === "finished") {
                return done(null, this.events);
            }

            if (/^wshshell/i.test(event.target.name)) {
                if (/^(?:run|exec)$/i.test(event.property)) {
                    this.events.push(event.args[0].value);
                }
            }
            else if (/^shellapplication/i.test(event.target.name)) {
                if (/^shellexecute$/i.test(event.property)) {
                    this.events.push(event.args[0].value);
                }
            }
        }
    };
};

module.exports = DumpExec;
