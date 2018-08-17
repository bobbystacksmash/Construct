module.exports = {

    meta: {
        title: "Dump all function input/output values.",
        name: "dumpfnio",
        description: "Dumps all captured function arguments and return values."
    },

    report: (events) => {
        console.log(JSON.stringify(events), null, 2);
    }
};
