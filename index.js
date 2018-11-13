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

    /**
     * @param {object} options Construct configuration options.
     * @param {string} options.config Filepath to a TOML cfg.
     * @param {string} [options.reporters_dir] Dirpath to the reporters directory.
     */
    constructor (options) {
        //
        // Setup the configuration file.
        //
        const DEFAULT_OPTS = {
            epoch: new Date().getTime()
        };
        options     = options || {};
        options     = Object.assign(DEFAULT_OPTS, options);
        this.config = this._load_config_file(options.config);

        //
        // Prepare the runtime envifronment.
        //
        this.runtime = new Runtime({
            config: this.config
        });

        //
        // Load the reporters.
        //
        this._reporters = this._load_reporters(this.config.reporters_dir);
    }

    /**
     * Begins the analysis of a given file.
     * @param {string} path Path to the file to analayse.
     * @param {object} [options] Additional optionsto pass to the analyser.
     * @param {object} [options.reporter=dumpevents] Name of the output reporter to use.
     *
     * @return {Promise<object>} Resolves with the output from the selected reporter.
     */
    async analyse (path, options) {

        const DEFAULT_ANALYSER_OPTS = {
            reporter: "dumpevents"
        };

        options = options || {};
        options = Object.assign(DEFAULT_ANALYSER_OPTS, options);

        return new Promise((resolve, reject) => {

            try {
                this._set_reporter(options.reporter);
            }
            catch (err) {
                reject(err);
            }

            var done_callback = function (err, success) {
                (err) ? reject(err) : resolve(success);
            };

            // First, we try to load the JScript program from disk...
            try {
                var runnable = this.runtime.load(path, done_callback, options);
            }
            catch (e) {
                console.log(`Error parsing file '${path}':`);
                console.log(`Check that the file contains valid JScript code (only).`);
                reject(e);
            }

            // Great!  We now have a `runnable.  A runnable is just a
            // function, so let's call it to kick off analysis.
            runnable();
        });
    }

    /**
     * Fetches the list of loaded reporters.
     *
     * @returns {object} Mapping between reporter name and reporter metadata.
     */
    get reporters () {
        return this._reporters;
    }

    // ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // ;;                             ;;
    // ;;    P R I V A T E   A P I    ;;
    // ;;                             ;;
    // ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

    _set_reporter (reporter_name) {

        var reporter = null;

        if (typeof reporter_name === "string") {
            reporter = this.reporters[reporter_name];
            if (!reporter) {
                throw new Error("ERR: Unknown reporter: " + reporter_name);
            }

            reporter = reporter.report;
        }

        this.runtime.add_event_listener(reporter);
    }


    /**
     * Loads a TOML configuration file from disk.
     *
     * @param {string} cfg_path Path to the configuration file to load.
     * @return {object} Configuration file as a POJO.
     */
    _load_config_file (cfg_path) {

        try {
            let cfg    = fs.readFileSync(cfg_path).toString(),
                parsed = toml.parse(cfg),
                whoami = parsed.general.whoami;

            cfg = cfg.replace(/\$WHOAMI/g, whoami);
            parsed = toml.parse(cfg);

            if (parsed.hasOwnProperty("general") && parsed.general.hasOwnProperty("override")) {

                let opath     = path.resolve(parsed.general.override),
                    overrides = fs.readFileSync(opath).toString();

                overrides = overrides.replace(/\$WHOAMI/g, whoami);
                overrides = toml.parse(overrides);

                parsed = Object.assign(parsed, overrides);
            }

            // Special handling here for the setting of an epoch.
            // This is important for Construct's internal clock.
            let epoch = new Date().getTime();
            try {
                epoch = parsed.environment.epoch;
            } catch (_) {}

            try {
                epoch = (epoch === "now")
                    ? new Date().getTime()
                    : new Date(epoch).getTime();
                parsed.environment.epoch = epoch;
            }
            catch (e) {
                // TODO: do we want to give a better err message RE: epochs?
                throw e;
            }

            return parsed;
        }
        catch (e) {
            console.log("Error: Unable to load configuration file:", cfg_path);
            console.log(e.message);
            throw e;
        }
    }

    /**
     * Loads reporters from the given dirpath.
     *
     * @param {string} dirpath Dirpath to load reporters from.
     * @returns {object} Which maps 'reporter name' to 'reporter fn'.
     */
    _load_reporters (dirpath) {

        dirpath = dirpath || "./reporters";

        // given either a string or an array of strings, where each
        // string is a path, attempt to load reporters from each of
        // the paths.
        dirpath = dirpath.replace(/\/*$/, "");

        let reporters = {},
            globpat   = `${dirpath}/**/*.js`;

        glob.sync(globpat).forEach(reporter_file => {
            try {
                const loaded_file = require(path.resolve(reporter_file));
                reporters[loaded_file.meta.name.toLowerCase()] = loaded_file;
            }
            catch (e) {
                console.log("Error attempting to load reporter:", reporter_file);
                console.log("Please remove or fix this file before rerunning.");
                console.log(e.message);
                process.exit(1);
            }
        });

        return reporters;
    }
}

class ConstructOld {

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

        this._reporters = {};
    }

    _load_config (cfg_path) {

        try {
            var cfg    = fs.readFileSync(cfg_path).toString(),
                parsed = toml.parse(cfg),
                whoami = parsed.general.whoami;

            cfg = cfg.replace(/\$WHOAMI/g, whoami);
            parsed = toml.parse(cfg);

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
        return this._reporters;
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
