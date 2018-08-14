module.exports = {

    meta: {
        title: "Dump Registry Indicators",
        name: "dumpreg",
        description: "Extracts and dumps various registry indicators."
    },

    report: (events) => {
        events.forEach(event => {

            if (/wshshell/i.test(event.target) && /regread/i.test(event.prop)) {
                console.log(`"${event.target}","${event.prop}","${event.args[0]}","${event.return}"`);
            }
            else if (/wshshell/i.test(event.target) && /regwrite/i.test(event.prop)) {
                console.log("REGWRITE");
            }
        });

    }
};
