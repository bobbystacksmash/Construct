// ########################################################
// #                                                      #
// #                   C O N S T R U C T                  #
// #                          ~~~                         #
// #             m e t a p r o g r a m m i n g            #
// #                                                      #
// ########################################################
//
const fs             = require("fs");
const detect_globals = require("acorn-globals");
const falafel        = require("falafel");
const path           = require("path");

function RewriteSyntax (source, options) {
    options = options || {};

    const plugins_path = path.join(process.cwd(), "src", "metaprogramming", "plugins");

    this.plugins = this.load_plugins(plugins_path);
    this._source = source;

    return this;
}

// Load Plugins
// ============
//
// Plugins are loaded from this module's `./plugins' directory.
// Plugins should be wholly contained to a single file and export a
// function which accepts two parameters:
//
//   1. source  - [required] the source code the plugin should transform.
//   2. options - [optional] an object of plugin specific config items.
//
// The name of each plugin file is also important.  The plugin loader
// will attempt to `require()' all files which do not begin with an
// end with ".js".  The plugin name should use underscore_case to have
// the name automatically transformed to something more friendly, for
// example:
//
//  | Original Filename | Friendly Name   |
//  |-------------------|-----------------|
//  | Eval_capture.js   | "eval capture"  |
//  | hoist_globals.js  | "hoist globals" |
//
RewriteSyntax.prototype.load_plugins = function (load_plugins_path) {

    var plugins = {},
        plugin_files = fs.readdirSync(load_plugins_path);

    plugin_files.forEach(item => {

        const fpath    = path.join(load_plugins_path, item),
              is_valid = /\.js$/i.test(item) && /^[a-z0-9]+[_]?[a-z0-9]*\.js$/i.test(item);

        if (is_valid === false || fs.statSync(fpath).isFile() === false) return;

        let plugin_name = item.toLowerCase()
                .replace(/_/g, " ")
                .replace(/\.js$/i, "")
                .replace(/^\s*|\s*$/g, "");

        plugins[plugin_name] = require(`${fpath}`);
    });

    return plugins;
};

RewriteSyntax.prototype.source = function () {
    return this._source;
};

RewriteSyntax.prototype.using = function (plugin, options) {

    options = options || {};

    if (this.plugins.hasOwnProperty(plugin) === false) {
        throw new Error(`Unknown plugin: ${plugin}`);
    }

    this._source = this.plugins[plugin](this._source, options);
    return this;
};

module.exports = RewriteSyntax;
