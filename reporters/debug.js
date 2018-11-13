let events = [];

module.exports = {

    meta: {
        name: "debug",
        description: "Displays real-time debug information in JSON format."
    },

    report: (event, done) => {
        console.log(JSON.stringify(event));
        if (event.meta === "finished") {
            done(null, {});
        }


    }
};
