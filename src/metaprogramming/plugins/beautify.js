const beautify = require('js-beautify').js_beautify;

module.exports = function (source, options) {
    return beautify(source, { indent_size: 2 });
};
