
function DebugReporter () {

    this.events = [];

    return {
        meta: {
            name: "debug",
            description: "Displays real-time debug information in JSON format."
        },

        report: (event, done) => {
            this.events.push(event);
            if (event.meta === "finished") {
                done(null, this.events);
            }
        }
    };
};

module.exports = DebugReporter;
