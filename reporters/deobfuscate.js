
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

        let instance = obj.target.replace(/[.-]/g, "").toLowerCase(),
            id       = obj.id;

        return `${instance}_${id}`;
    }

    function args_to_string (args) {
        return args.map(arg => {

            switch (arg.type) {
            case "string":
                return `'${arg.value}'`;
            case "number":
                return `${arg.value}`;

            case "object":
                if (Buffer.isBuffer(arg.value)) {
                    let octets = [];
                    for (let octet of arg.value) octets.push(octet);
                    octets = Array.prototype.slice.call(octets, 0, 8).join(", ");
                    return `Buffer<${octets}, ..>`;
                }

            default:
                return arg.value;
            }
        }).join(",");
    }

    function method_to_source (e) {

        let identifier = symtbl_lookup(e.target.id),
            args       = args_to_string(e.args),
            retval     = e.retval;

        if (retval && retval.hasOwnProperty("target") && retval.hasOwnProperty("id")) {
            // The return value of this method call requires a symbol
            // be used to store the returned instance.
            identifier = generate_identifier(retval);
            symtbl_insert(retval.id, identifier);
            return `var ${identifier} = ${e.target.name}.${e.property}(${args});`;
        }

        if (identifier === null) {
            identifier = e.target.name;
        }

        if (retval === undefined) {
            return `${e.target.name}.${e.property}(${args});`;
        }
        else if (typeof retval === "string" || typeof retval === "number") {
            return `${identifier}.${e.property}(${args}); // => ${retval}`;
        }
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
            else if (/^date$/i.test(e.target.name)) {

                let identifier = generate_identifier(e.retval),
                    args       = args_to_string(e.args);
                symtbl_insert(e.retval.id, identifier);

                return `var ${identifier} = new Date(${args});`;
            }
        }
        else if (e.type === "getter") {

            let identifier = symtbl_lookup(e.target.id),
                retval     = e.retval;

            if (e.target.name === "WScript") {
                identifier = "WScript";
            }

            let statement = `${identifier}.${e.property};`;

            if (typeof retval === "string" || typeof retval === "number") {
                statement += ` // => ${e.retval}`;
            }

            return statement;
        }
        else if (e.type === "setter") {

            // Fetch the identifier we'd like to assign-to:
            let identifier = symtbl_lookup(e.target.id),
                args       = args_to_string(e.args);

            return `${identifier}.${e.property} = ${args};`;
        }
        else if (e.type === "method") {
            return method_to_source(e);
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
