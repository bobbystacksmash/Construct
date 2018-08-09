module.exports = {
    meta: {
        title: "API Call Generator",
        name: "apicallgen",
        description: "foobar"
    },

    report: function (events) {
        events.forEach(event => {
            console.log(`${event.target}.${event.prop}(${event.args})`);
        });
    }
};
