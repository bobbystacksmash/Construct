const evts = require("./events");


module.exports = function proxify2(target_obj, tag, opts) {

    if (!opts) opts = {};

    console.log("proxify2(opts.emitter = " + tag);

    let ee = opts.emitter || { emit: () => {} };

    return new Proxy(target_obj, {

        /*
         * =========================
         * Intercepts function calls
         * =========================
         */
        apply: (target, ctx, args) => {
            return Reflect.apply(...arguments);
        },

        /*
         * ==========================
         * Intercepts property access
         * ==========================
         */
        get: (target, key) => {

            if (!target.hasOwnProperty(key)) {
                ee.emit(evts.DEBUG.property.missing, {
                    type: "get",
                    tag: tag,
                    target: target,
                    key: key,
                    exists: false
                });

                return;
            }

            ee.emit(evts.DEBUG.property.exists, {
                type: "get",
                tag: tag,
                target: target,
                key: key,
                exists: true
            });

            return target[key];
        },

        /*
         * ======================
         * Intercepts 'new' calls
         * ======================
         */
        construct: (target, args) => {

            ee.emit(evts.DEBUG.constructed, {
                type: "constructed",
                args: args,
                tag:  tag
            });

            return new target(...args);
        }
    });
}

