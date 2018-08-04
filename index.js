/*
 * XXXXXXXXXXXXXXXXX
 * C O N S T R U C T
 * XXXXXXXXXXXXXXXXX
 *
 */

const Runtime = require("./src/runtime");

class Construct {

    constructor (options) {

        options = options || {};

        // Apply some sane defaults.
        const defaults = {
            epoch: new Date().getTime()
        };
        options = Object.assign(defaults, options);

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


    run () {
        this.runnable(function (err, results) {
            if (err) {
                console.log("TODO: fix the error handling for a crashed runnable!");
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

}

module.exports = Construct;
