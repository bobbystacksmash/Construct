
function DumpFS () {
    this.events = [];

    return {
        meta: {
            title: "Dump Filesystem Indicators",
            name: "dumpfs",
            description: "Extracts and dumps various filesystem indicators."
        },

        report: (event, done) => {

            if (event.meta === "finished") {
                done(null, this.events);
            }
            else if (event.meta && event.meta === "runtime.api.call") {
                if (/^(?:filesystemobject|file|folder)/i.test(event.target)) {
                    this.events.push(event);
                }
                else if (/^adodbstream$/i.test(event.target) && event.property.normalised === "savetofile") {
                    this.events.push(event);
                }
            }
        }
    };
};

module.exports = DumpFS;
