const detect_globals = require("acorn-globals");

module.exports = function(source, options) {

    options = options || {};

    const defaults = {
        reserved_globals: [
            // JScript provides the following list of global
            // identifiers which we do not want to hoist.
            "Function",
            "ActiveXObject",
            "eval",
            "this",
            "String",
            "parseInt",
            "RegExp",
            "Array",
            "Date",
            "WScript"
        ]
    };
    options = Object.assign(defaults, options);

    let reserved_globals_RE = new RegExp("^(?:" + options.reserved_globals.join("|") + ")$"),
        list_of_all_globals = detect_globals(source);

    const globals = list_of_all_globals
              .filter(g   => !reserved_globals_RE.test(g.name))
              .map(g => `var ${g.name};`);

    if (globals.length === 0) {
        return source;
    }

    const hoisted_globals_source = `${globals.join("\n")}\n\n${source}`;
    return hoisted_globals_source;
};
