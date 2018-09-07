function make_emitter_message (target, property, args, type, retval, hooked) {

    if (retval && retval.__name__) {
        // The return value is an instance.  Instead of returning the
        // *whole* instance, return some meta info about the instance
        // so we can still track it later, without causing a cicular
        // reference issue.
        retval = {
            target: retval.__name__,
            id:     retval.__id__
        };
    }

    if (hooked === undefined || hooked === null) {
        hooked = false;
    }
    else if (hooked !== false) {
        hooked = true;
    }

    if (Array.isArray(args) === false) {
        args = [args];
    }

    let typed_args = args.map(arg => {
        return {
            type:  typeof arg,
            value: arg
        };
    });

    return {
        target:  target.__name__.replace(".", ""),
        id:      target.__id__,
        hooked:  hooked,
        prop:    property,
        args:    typed_args,
        type:    type,
        return:  (retval === undefined) ? null : retval
    };
}

let proxified_objects_cache = {};

module.exports = function (context, jscript_class) {

    const proxyobj = {
        get (target, property, receiver) {

            if (typeof property === "symbol") {
                return target[property];
            }

            let lc_property = property.toLowerCase();
            const target_value = Reflect.get(target, lc_property, receiver);

            if (typeof target_value === "function") {
                if (target_value.__name__ === "WshEnvironment") {
                    return target_value;
                }
                else {
                    return function (...args) {
                        return target_value.apply(this, args);
                    };
                }
            }
            else {
                return target_value;
            }
        },
        set (target, property, value) {

            let lc_property = property.toLowerCase();
            const retval = Reflect.set(target, lc_property, value);
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
