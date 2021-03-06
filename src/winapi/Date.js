const Component         = require("../Component"),
      proxify           = require("../proxify2"),
      ObjectInteraction = require("../ObjectInteraction");

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

        let apicall = new ObjectInteraction(context, {
            target: { name: "Date", id: component.__id__ },
            property: "new",
            type: ObjectInteraction.TYPE_CONSTRUCTOR,
            args: [...args],
            retval: component
        });

        apicall.emit_event("runtime.api.method");

        return new Proxy(instance, {
            get (target, property) {
                const objprop = target[property];

                if (typeof objprop === "function") {
                    return function (...args) {
                        const retval = target[property](...args);

                        let apicall = new ObjectInteraction(context, {
                            target: { name: "Date", id: component.__id__ },
                            property: property,
                            type: ObjectInteraction.TYPE_METHOD,
                            args: [...args],
                            retval: retval
                        });

                        apicall.emit_event(`runtime.api.method`);
                        return retval;
                    };
                }
                else {

                    let apicall = new ObjectInteraction(context, {
                        target: { name: "Date", id: component.__id__ },
                        property: property,
                        type: ObjectInteraction.TYPE_GETTER,
                        args: [],
                        retval: objprop
                    });
                    apicall.emit_event(`runtime.api.getter`);

                    return objprop;
                }
            },

            set (target, property, value) {
                const retval = Reflect.set(target, property, value);
                let apicall = new ObjectInteraction(context, {
                    target: { name: "Date", id: component.__id__ },
                    property: property,
                    type: ObjectInteraction.TYPE_SETTER,
                    args: [value],
                    retval: retval
                });

                apicall.emit_event(`runtime.api.setter`);

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

    return JS_Date;
};
