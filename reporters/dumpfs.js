module.exports = {

    meta: {
        title: "Dump Filesystem Indicators",
        name: "dumpfs",
        description: "Extracts and dumps various filesystem indicators."
    },

    report: (events) => {
        events.forEach(event => {

            if (/filesystemobject/i.test(event.target)) {
                console.log(`"${event.target}","${event.prop},"${event.args[0]}","${event.return}"`);
            }
        });

    }
};
