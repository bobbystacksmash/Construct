module.exports = {

    meta: {
        title: "Dump Network Indicators",
        name: "dumpnet",
        description: "Extracts and dumps various network indicators."
    },

    report: (events) => {
        events.forEach(event => {
            if (/xmlhttp/i.test(event.target) === false || event.prop !== "open") return;
            console.log(`${event.target},${event.prop},${encodeURI(event.args[1])}`);
        });

    }
};
