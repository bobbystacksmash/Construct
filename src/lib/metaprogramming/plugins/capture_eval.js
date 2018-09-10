const falafel      = require("falafel"),
      beautify     = require('js-beautify').js_beautify;

function capture_eval (source, options) {

    options = options || {};
    const defaults = { fn_name: "___EVAL___", beautify: true };
    options = Object.assign(defaults, options);

    let instrumented_source = falafel(source, function (node) {

        if (node.type === "CallExpression" && node.callee.name === "eval") {
            if (node.arguments.length > 0) {
                const evalstr = node.arguments[0].source();
                node.arguments[0].update(`${options.fn_name}(${evalstr})`);
            }
        }
    });

    const capture_fnio = require("./capture_fnio");
    instrumented_source = capture_fnio(instrumented_source.toString(), { fn_name: "capture_fnio" });

    if (options.beautify) {
        return beautify(instrumented_source, { indent_size: 2 });
    }
    else {
        return instrumented_source.toString();
    }
}

module.exports = capture_eval;
