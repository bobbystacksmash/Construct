
function DumpFNIO () {

    this.events = [];

    return {
        meta: {
            title: "Dump all function input/output values.",
            name: "dumpfnio",
            description: "Dumps all captured function arguments and return values."
        },

        report: (events, done) => {
            // TODO...
            done(null, events);
        }
    };
};

module.exports = DumpFNIO;
