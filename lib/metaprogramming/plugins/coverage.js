const istanbul = require("istanbul");

module.exports = function (source, options) {
    options = options || { filepath: "dummy" };
    const defaults = { filepath: "dummy" };
    options = Object.assign(defaults, options);

    const instrumenter     = new istanbul.Instrumenter({ coverageVariable: "__coverage__"}),
          instrumented_src = instrumenter.instrumentSync(source, options.filepath);

    // In order to collect coverage information, we need to inject a
    // CallExpression at the end of the script which will pass the
    // "__coverage__" object out of the sandbox so we can get the
    // results.
    let make_cov_report_source = `${options.oncomplete}(__coverage__);`;
    return `${instrumented_src.toString()}${make_cov_report_source}`;
};
