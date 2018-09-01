/*
 * XXXXXXXXXXXXXXXXX
 * C O N S T R U C T
 * XXXXXXXXXXXXXXXXX
 *
 */

const Runtime  = require("./src/runtime"),
      coverage = require("./src/coverage"),
      istanbul = require("istanbul"),
      toml     = require("toml"),
      glob     = require("glob"),
      path     = require("path"),
      fs       = require("fs");

class Construct {

    constructor (options) {

        this.config = this._load_config(options.config);

        var epoch = new Date().getTime();
        try {
            epoch = this.config.environment.epoch;
        } catch (_) {}

        try {
            epoch = (epoch === "now")
                ? new Date().getTime()
                : new Date(epoch).getTime();
            this.config.environment.epoch = epoch;
        }
        catch (e) {
            throw e;
        }

        // This constructor is really a factory for building the
        // Construct environment.  The first thing we need is the
        // Runtime.  The runtime is the wrapper which handles
        // transforming code in to something we can analyse.
        this.runtime = new Runtime({
            config: this.config
        });

        this.reporters = {};
    }

    _load_config (cfg_path) {

        try {
            var cfg    = fs.readFileSync(cfg_path).toString(),
                parsed = toml.parse(cfg),
                whoami = parsed.whoami;

            cfg = cfg.replace(/\$WHOAMI/g, whoami);

            if (parsed.hasOwnProperty("general") && parsed.general.hasOwnProperty("override")) {

                let opath  = path.resolve(parsed.general.override),
                    orides = fs.readFileSync(opath).toString();

                orides = orides.replace(/\$WHOAMI/g, whoami);
                orides = toml.parse(orides);

                parsed = Object.assign(parsed, orides);
            }

            return parsed;
        }
        catch (e) {
            console.log("Error: Unable to load configuration file:", cfg_path);
            console.log(e.message);
            throw e;
        }
    }

    load (path_to_file, options) {

        this.file = path_to_file;

        try {
            this._runnable = this.runtime.load(path_to_file, options);
        }
        catch (e) {
            console.log(`Error parsing file '${path_to_file}':`);
            console.log(`Check that the file contains valid JScript code (only).`);
            console.log(e.message);
            process.exit(1);
        }
    }

    load_reporters (reporters_path) {
        // given either a string or an array of strings, where each
        // string is a path, attempt to load reporters from each of
        // the paths.
        reporters_path = reporters_path.replace(/\/*$/, "");

        let globpat = `${reporters_path}/**/*.js`;
        glob.sync(globpat).forEach(reporter_file => {
            try {
                const loaded_file = require(path.resolve(reporter_file));
                this.reporters[loaded_file.meta.name.toLowerCase()] = loaded_file;
            }
            catch (e) {
                console.log("Error attempting to load reporter:", reporter_file);
                console.log("Please remove or fix this file before rerunning.");
                console.log(e.message);
                process.exit(1);
            }
        });
    }

    get_reporters () {
        return this.reporters;
    }

    run () {
        return this._runnable(function (err, results) {
            if (err) {
                this.context.emitter.emit("runtime.exception", err);
                this.context.emitter.emit("finished", {});
                return false;
            }

            return results;

        }.bind(this.runtime));
    }

    events (filter_fn) {

        if (typeof filter_fn !== "function") {
            filter_fn = function () { return true; };
        }

        return this.runtime.events.filter(filter_fn);
    }

    onevent (handler) {

        if (typeof handler === "string") {

            let reporter = this.get_reporters()[handler];
            if (!reporter) {
                throw new Error("ERR: Unknown reporter", handler);
            }
            handler = reporter.report;
        }

        this.runtime.add_event_listener(handler);
    }

    coverage () {
        coverage.generate_coverage_report(
            this.runtime.coverage_report,
            this.runtime.source.beautified,
            this.runtime.file_path
        );
    }
}

module.exports = Construct;
