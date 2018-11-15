function DumpEvents () {

    this.events = [];

    return {
        meta: {
            name: "dumpevents",
            description: "Returns a JSON object containing all captured events."
        },

        report: (event, done) => {

            if (event.meta === "finished") {
                done(null, this.events);
            }
            else {
                this.events.push(event);
            }
        }
    };
}


module.exports = DumpEvents;
