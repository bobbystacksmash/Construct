const cstsc = require("../../cstsc");

module.exports = function (source) {
    return cstsc.transpile(source);
}
