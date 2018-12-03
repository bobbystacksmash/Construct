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
        this._config = this._load_config_file(options.config);

        //
        // Prepare the runtime envifronment.
        //
        this.runtime = new Runtime({
            config: this._config
        });

        //
        // Load the reporters.
        //
        this._reporters = this._load_reporters(this._config.reporters_dir);
    }

    /**
     * Returns an instance of the Construct configuration.
     *
     * @return {Object} The configuration instance.
     */
    get config () {
        return this._config;
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

                if (err) {
                    return reject(err);
                }

                // Add header information.
                let header = {
                    src: path,
                    reporter: options.reporter
                };

                return resolve((Object.assign({ header: header }, { body: success })));
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

                let Reporter = require(path.resolve(reporter_file)),
                    reporter = new Reporter();

                reporters[reporter.meta.name.toLowerCase()] = reporter;
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

module.exports = Construct;
