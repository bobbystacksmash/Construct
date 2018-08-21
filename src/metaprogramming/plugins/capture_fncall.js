const falafel      = require("falafel"),
      beautify     = require('js-beautify').js_beautify;

function capture_fncall_args (source, options) {

    options = options || {};
    const defaults = { fn_name: "___CAPTURE___", beautify: true };
    options = Object.assign(defaults, options);

    let ins_source = falafel(source, function (node) {

        if (node.type === "CallExpression" && node.arguments.length > 0) {
            node.arguments.forEach(arg => {
                const argsrc = arg.source();
                arg.update(`${options.fn_name}(${argsrc})`);
            });
        }
    });

    return ins_source.toString();
}

module.exports = capture_fncall_args;
