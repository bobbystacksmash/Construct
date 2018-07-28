const istanbul = require("istanbul");

const instrumenter = new istanbul.Instrumenter(),
      cover_utils  = istanbul.utils,
      collector    = new istanbul.Collector();

module.exports = function (source, options) {
    options = options || { filepath: "dummy" };
    return instrumenter.instrumentSync(source, options.filepath);
}
