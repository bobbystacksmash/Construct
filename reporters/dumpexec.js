module.exports = {

    meta: {
        title: "Dump Execuation Indicators",
        name: "dumpexec",
        description: "Extracts and dumps various execution indicators."
    },

    report: (events) => {
        events.forEach(event => {

            if (/wshshell/i.test(event.target) && /run/i.test(event.prop)) {
                console.log(`"${event.target}","${event.prop}","${event.args[0]}","${event.return}"`);
            }
        });

    }
};
