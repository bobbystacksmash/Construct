const istanbul = require("istanbul");

module.exports = function (source, options) {

    options = options || { filepath: "dummy", variable: "__coverage__" };
    const defaults = { filepath: "dummy", variable: "__coverage__" };
    options = Object.assign(defaults, options);

    const instrumenter     = new istanbul.Instrumenter({ coverageVariable: options.variable}),
          instrumented_src = instrumenter.instrumentSync(source, options.filepath);

    // In order to collect coverage information, we need to inject a
    // CallExpression at the end of the script which will pass the
    // coverage object out of the sandbox so we can get the results.
    let make_cov_report_source = `${options.oncomplete}(${options.variable});`;
    return `${instrumented_src.toString()}\n${make_cov_report_source}`;
};
