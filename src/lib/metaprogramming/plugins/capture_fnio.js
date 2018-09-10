const falafel  = require("falafel"),
      uuid     = require("uuid");

let fn_name_placeholders = [];

function generate_label () {
    return uuid().replace("-", "_");
}

function is_func (node) {

    if (!node.hasOwnProperty("parent")) return false;
    return /^Function(?:Expression|Declaration)$/.test(node.parent.type);
}

function capture_function_io (source, options) {

    options = options || {};
    const defaults = { fn_name: "___CAPTURE___" };
    options = Object.assign(defaults, options);

    const capture_fnio_name = options.fn_name;

    let isrc = falafel(source, function (node) {

        if (node.type === "BlockStatement" && is_func(node)) {

            // A FunctionDeclaration always has a name, while a
            // FunctionExpression /may/ not.

            let bodysrc         = node.body[0].source(),
                fn_name         = null,
                resolve_fn_name = false;

            if (node.parent.id === null) {
                if (fn_name_placeholders.length) {
                    fn_name = fn_name_placeholders.pop();
                }
                else {
                    fn_name = generate_label();
                }
            }
            else {
                fn_name = node.parent.id.name;
                resolve_fn_name = true;
            }

            node.body[0].update(`${capture_fnio_name}("${fn_name}", "args", arguments);${bodysrc}`);

            if (resolve_fn_name) {
                const placeholder = fn_name_placeholders.pop();
                node.update(node.source().replace(placeholder, fn_name));
            }
        }
        else if (node.type === "ReturnStatement") {

            // Finding Fn Names
            // ----------------
            //
            // Falafel recursively walks the AST in pre-traversal order,
            // so child nodes get called before their parents, meaning we
            // won't have a function name available to us when this block
            // is processed.  Therefore, we generate a label, which will
            // get popped off later when the FunctionExpr / FunctionDecl
            // are reached.
            //
            const placeholder = generate_label();
            fn_name_placeholders.push(placeholder);

            if (node.argument !== null) {
                let returnsrc = node.argument.source();
                node.argument.update(`${capture_fnio_name}("${placeholder}", "return", ${returnsrc})`);
            }
            else {
                node.source(`${capture_fnio_name}("${placeholder}", "return", "")`);
            }
        }
    });

    return isrc.toString();
}

module.exports = capture_function_io;
