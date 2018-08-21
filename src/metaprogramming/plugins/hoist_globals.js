const detect_globals = require("acorn-globals"),
      falafel        = require("falafel");

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

    const globals = list_of_all_globals.filter(g => !reserved_globals_RE.test(g.name));

    let referenced_globals = [];

    falafel(source, function (node) {

        if (node.type === "AssignmentExpression") {
            //
            // Handles cases such as:
            //   var x = 10;
            //
            let var_name = node.left.name;
            if (globals.some(g => g.name === var_name)) {
                referenced_globals.push(var_name);
            }
        }
        else if (node.type === "FunctionDeclaration" && node.params.length) {
            //
            // Handles cases such as:
            //   function foo (bar) { ...
            //                 ^^^
            node.params.forEach(param => {
                if (globals.some(g => g.name === param.name)) {
                    referenced_globals.push(param.name);
                }
            });
        }
    });

    referenced_globals = referenced_globals.map(g => `var ${g};`);

    if (referenced_globals.length === 0) {
        return source;
    }

    const hoisted_globals_source = `${referenced_globals.join("\n")}\n\n${source}`;
    return hoisted_globals_source;
};
