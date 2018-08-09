/*
 * XXXXXXXXXXXXXXXXX
 * C O N S T R U C T
 * XXXXXXXXXXXXXXXXX
 *
 */

const Runtime  = require("./src/runtime"),
      istanbul = require("istanbul"),
      glob     = require("glob"),
      path     = require("path");

class Construct {

    constructor (options) {

        options = options || {};

        // Apply some sane defaults.
        const defaults = {
            epoch: new Date().getTime(),
            plugins: `./plugins`
        };
        options = Object.assign(defaults, options);

        this.reporters = {};

        this.runtime = new Runtime({
            epoch: options.epoch
        });
    }

    load (path_to_file) {

        this.file = path_to_file;

        try {
            this.runnable = this.runtime.load(path_to_file);
        }
        catch (e) {
            throw e;
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
                this.reporters[loaded_file.meta.name] = loaded_file;
            }
            catch (e) {
                console.log("Error attempting to load reporter:", reporter_file);
                console.log("Please remove or fix this file before rerunning.");
                console.log(e.message);
                process.exit(1);
            }
        });
    }

    apply_reporter (reporter, events) {

        reporter = reporter.toLowerCase();

        if (this.reporters.hasOwnProperty(reporter)) {
            return this.reporters[reporter].report(events);
        }

        return false;
    }

    run () {
        this.runnable(function (err, results) {
            if (err) {
                console.log("TODO: fix the error handling for a crashed runnable!");
                console.log(err);
                console.log(err.message);
                return false;
            }

            return results.success;

        }.bind(this.runtime));
    }

    events (filter_fn) {

        if (typeof filter_fn !== "function") {
            filter_fn = function () { return true; };
        }

        return this.runtime.events.filter(filter_fn);
    }

    coverage (type) {

        type = type || "summary";

        const collector = new istanbul.Collector();
        collector.add(this.runtime.coverage);

        if (type === "summary") {
            return istanbul.utils.summarizeFileCoverage(
                collector.fileCoverageFor(collector.files()[0])
            );
        }

        return this.runtime.coverage;
    }

    runnable (output_filename) {
        console.log(this.runnable.toString());
    }
}

module.exports = Construct;
