
function DeObfuscate () {

    this.events     = [];
    this.symbol_tbl = {};

    function symtbl_lookup (id) {

    }

    function symtbl_insert (event) {
        console.log("inserting", event);
    }

    function event_to_source (e) {

        if (/^activexobject$/i.test(e.target.name)) {

            // We need to create a new identifier and store it in the
            // symbol table.
            symtbl_insert(e);
        }

        return `${e.target.name}.${e.property}`;
    }


    return {
        meta: {
            name: "deobfuscate",
            description: "Attempts to remove all obfuscation from an input program."
        },

        report: (event, done) => {

            if (event.meta === "finished") {
                done(null, this.events);
                return;
            }

            let src = event_to_source(event);
            this.events.push(src);
        }
    };
};

module.exports = DeObfuscate;
