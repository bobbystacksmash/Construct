let events = [];

module.exports = {

    meta: {
        name: "debug",
        description: "Displays real-time debug information in JSON format."
    },

    report: (event) => {
        console.log(JSON.stringify(event));
    }
};
