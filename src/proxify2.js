const ObjectInteraction = require("./ObjectInteraction");

module.exports = function (context, jscript_class) {

    const proxyobj = {
        get (target, property, receiver) {

            if (typeof property === "symbol" || (/^__(?:name|id)__$/i.test(property))) {
                return target[property];
            }
            else if (!target.hasOwnProperty("__name__") || !target.hasOwnProperty("__id__")) {
                return Reflect.get(target, property, receiver);
            }

            const lc_property  = property.toLowerCase(),
                  target_value = Reflect.get(target, lc_property, receiver);

            let apicall = new ObjectInteraction({
                target: target,
                property: property
            });

            if (typeof target_value === "function") {

                if (target_value.__name__ === "WshEnvironment") {
                    return target_value;
                }
                else {
                    return function (...args) {

                        const retval   = jscript_class[lc_property](...args);
                        apicall.type   = ObjectInteraction.TYPE_METHOD;
                        apicall.args   = [...args];
                        apicall.retval = retval;
                        context.emitter.emit(`runtime.api.method`, apicall.event());

                        return retval;
                    };
                }
            }
            else {
                apicall.type   = ObjectInteraction.TYPE_GETTER;
                apicall.retval = target_value;
                context.emitter.emit(`runtime.api.getter`, apicall.event());

                return target_value;
            }
        },
        set (target, property, value) {

            let apicall = new ObjectInteraction({
                target:   target,
                property: property,
                args:     value
            });

            let lc_property = property.toLowerCase();
            const retval = Reflect.set(target, lc_property, value);

            apicall.retval = retval;
            context.emitter.emit(`runtime.api.setter`, apicall.event());

            return retval;
        }
    };

    // All JScript objects have an `__id__' property which is unique
    // for each instance of each object.  We don't want to try and
    // proxify something which is already wrapped in a proxy, so we
    // check the ID in our cache, and either return the proxified
    // instance, or create a new one (adding it to the cache).
    let instance = context.get_instance_by_id(jscript_class.__id__);

    if (!instance) {
        instance = new Proxy(jscript_class, proxyobj);
        context.add_instance(instance);
    }

    return instance;
};
