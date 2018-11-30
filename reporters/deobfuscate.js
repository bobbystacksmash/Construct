
function DeObfuscate () {

    this.events     = [];
    var symbol_tbl = {};

    function symtbl_lookup (id) {

        if (symbol_tbl.hasOwnProperty(id)) {
            return symbol_tbl[id];
        }

        return null;
    }

    function symtbl_insert (id, identifier) {
        symbol_tbl[id] = identifier;
    }

    function generate_identifier (obj) {

        let instance = obj.instance.replace(/[.-]/g, "").toLowerCase(),
            id       = obj.id;

        return `${instance}_${id}`;
    }

    function args_to_string (args) {
        return args.map(arg => {
            return (arg.type === "string") ? `'${arg.value}'` : arg.value;
        }).join(",");
    }


    function event_to_source (e) {

        if (e.type === "constructor") {
            if (/^activexobject$/i.test(e.target.name)) {
                if (/^new$/i.test(e.property)) {
                    // Add a new entry to the symbol table for this
                    // instance.  The retval should contain the
                    // instance name and ID for the returned object.
                    let identifier = generate_identifier(e.retval),
                        args       = args_to_string(e.args);
                    symtbl_insert(e.retval.id, identifier);

                    return `var ${identifier} = new ActiveXObject(${args})`;
                }
            }
        }
        else if (e.type === "getter") {
            let identifier = symtbl_lookup(e.target.id);
            return `${identifier}.${e.property}`;
        }
        else if (e.type === "setter") {

            // Fetch the identifier we'd like to assign-to:
            let identifier = symtbl_lookup(e.target.id),
                args       = args_to_string(e.args);

            return `${identifier}.${e.property} = ${args};`;
        }
        else if (e.type === "method") {

            let identifier = symtbl_lookup(e.target.id),
                args       = args_to_string(e.args);

            return `${identifier}.${e.property}(${args});`;
        }
        else {
            console.log(e);
        }
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
