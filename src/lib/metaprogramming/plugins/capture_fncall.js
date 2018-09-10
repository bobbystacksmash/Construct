const falafel      = require("falafel"),
      beautify     = require('js-beautify');

function capture_fncall_args (source, options) {

    options = options || {};
    const defaults = { fn_name: "___CAPTURE___", beautify: true };
    options = Object.assign(defaults, options);

    let ins_source = falafel(source, { locations: true }, function (node) {

        if (node.type === "CallExpression" && node.arguments.length > 0) {

            let callee      = node.callee,
                callee_name = "[unknown]";

            if (callee && callee.type === "MemberExpression") {
                callee_name = callee.property.name;
            }
            else {
                callee_name = callee.name;
            }

            node.arguments.forEach(arg => {
                const argsrc = arg.source();
                arg.update(`${options.fn_name}("${callee_name}", ${JSON.stringify(node.loc)}, ${argsrc})`);
            });
        }
    });

    return ins_source.toString();
}

module.exports = capture_fncall_args;
