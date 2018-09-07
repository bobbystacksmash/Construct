const Component = require("../Component"),
      proxify   = require("../proxify2");

function make_emittable (obj) {

    //id, prop, args, type, retval) {

    return {
        target: "Date",
        id: obj.id,
        hooked: false,
        prop: obj.prop,
        args: obj.args,
        type: obj.type,
        return: obj.retval
    };
};

const DATE = Date;

module.exports = function create(context) {

    let component = new Component(context, "Date");

    function JS_Date(...args) {

        let component = new Component(context, "Date"),
            instance  = null;

        if (arguments.length === 0) {
            instance = new Date(context.epoch);
        }
        else {
            instance = new DATE(...args);
        }

        context.emitter.emit(
            "runtime.api.method",
            make_emittable({
                id: component.__id__,
                prop: "new",
                args: [...args],
                type: "method",
                retval: instance.getTime()
            })
        );

        return new Proxy(instance, {
            get (target, property) {
                const objprop = target[property];

                if (typeof objprop === "function") {
                    return function (...args) {
                        const retval = target[property](...args);
                        context.emitter.emit(
                            "runtime.api.method",
                            make_emittable({
                                id: component.__id__,
                                prop: property,
                                args: [...args],
                                type: "method",
                                retval: retval
                            })
                        );
                        return retval;
                    };
                }
                else {
                    context.emitter.emit(
                        "runtime.api.getter",
                        make_emittable({
                            id: component.__id__,
                            prop: property,
                            args: null,
                            type: "getter",
                            retval: objprop
                        })
                    );
                    return objprop;
                }
            },

            set (target, property, value) {
                const retval = Reflect.set(target, property, value);
                context.emitter.emit(
                    "runtime.api.setter",
                    make_emittable({
                        id: component.__id__,
                        prop: property,
                        args: value,
                        type: "setter",
                        retval: retval
                    })
                );

                return retval;
            }
        });
    }

    // #################
    // # M E T H O D S #
    // #################

    JS_Date.parse = function (...args) {

        let retval = DATE.parse(...args);
        context.emitter.emit(
            "runtime.api.method",
            make_emittable({
                id: component.__id__,
                prop: "parse",
                args: [...args],
                type: "method",
                retval: retval
            })
        );

        return retval;
    };

    JS_Date.now = function (...args) {

        let retval = new DATE(context.epoch).getTime();

        context.emitter.emit(
            "runtime.api.method",
            make_emittable({
                id: component.__id__,
                prop: "now",
                args: [...args],
                type: "method",
                retval: retval
            })
        );

        return retval;
    };

    JS_Date.UTC = function (...args) {

        let retval = DATE.UTC(context.epoch);

        context.emitter.emit(
            "runtime.api.method",
            make_emittable({
                id: component.__id__,
                prop: "UTC",
                args: [...args],
                type: "method",
                retval: retval
            })
        );

        return retval;
    };

    function emitter_method_call_helper (prop, args, retval) {
        console.log("CALLED");

        context.emitter.emit(
            "runtime.api.method",
            make_emittable({
                id: component.__id__,
                prop: prop,
                args: args,
                type: "method",
                retval: retval
            })
        );
    }

    return JS_Date;
};
