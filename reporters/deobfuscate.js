
let identifiers = {};

function get_identifier (event) {
    if (identifiers.hasOwnProperty(event.id) === false) {
        identifiers[event.id] = `v${event.id}`;
    }
    return identifiers[event.id];
}

function args_to_code (args) {

    if (args.length === 0) return "";

    return args.map(a => {
        if (a.type === "string") {
            return `"${a.value}"`;
        }
        else {
            return a.value;
        }
    }).join(", ");
}

function event_to_source (event) {

    let identifier = get_identifier(event);

    if (event.target === "WScript") {
        let arg_string = args_to_code(event.args);
        return `${event.target}.${event.prop}(${arg_string});`;
    }
    else if (event.type === "constructor") {

        if (event.target.toLowerCase() === "activexobject") {
            identifier = get_identifier({ id: event.return.id });
            return `var ${identifier} = new ActiveXObject("${event.args[0].value}");`;
        }
    }
    else if (event.type === "method") {
        let arg_string = args_to_code(event.args);

        return `${identifier}.${event.prop}(${arg_string})`;
    }
    else if (event.meta === "runtime.exception") {
        return [
            "",
            "/*",
            `  An unhandled runtime exception was thrown`,
            `  =========================================`,
            "",
            `  Reason: "${event.message}"`,
            "",
            "  Last API Call",
            "  -------------",
            JSON.stringify(event.last_prop, null, 1),
            "",
            "  Sandbox Stacktrace",
            "  ------------------",
            JSON.stringify(event.sandbox_stacktrace, null, 1),
            `*/`
        ].join("\n");
    }
    else {
        //console.log(event);
    }
}

module.exports = {

    meta: {
        name: "deobfuscate",
        description: "Exports the given JScript program with all obfuscation removed."
    },

    report: (event) => {
        const src = event_to_source(event);

        if (src) {
            console.log(src);
        }
    }
};
