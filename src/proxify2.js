function try_run_hook (context, apiobj, default_action) {

    let hook   = context.get_hook(apiobj),
        result = undefined;

    if (hook) {
        apiobj.hooked = true;
        var value = hook(context, apiobj, default_action);
        return value;
    }
    else if (typeof default_action === "function") {
        return default_action();
    }
    else {
        return default_action;
    }
}

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
        get (target, orig_property) {

            if (typeof orig_property === "symbol") {
                return target[orig_property];
            }

            const property = orig_property.toLowerCase(),
                  objprop  = target[property],
                  apiobj   = {
                      name: target.__name__.replace(".", "").toLowerCase(),
                      property: property,
                      original_property: orig_property,
                      id:   target.__id__,
                      args: null
                  };

            if (/^__(?:name|id)__$/i.test(property)) {
                return objprop;
            }

            context.emitter.emit("debug.getprop", apiobj);

            if (typeof objprop === "function") {
                return function (...args) {

                    apiobj.args = [...args];
                    apiobj.type = "method";
                    const retval = try_run_hook(context, apiobj, () => jscript_class[property](...args));

                    context.emitter.emit(
                        `runtime.api.method`,
                        make_emitter_message(target, property, [...args], apiobj.type, retval, apiobj.hooked)
                    );

                    return retval;
                };
            }
            else {

                const retval = try_run_hook(context, apiobj, objprop);
                apiobj.type = "getter";

                if (/^__(?:name|id)__$/.test(property) === false) {
                    context.emitter.emit(
                        "runtime.api.getter",
                        make_emitter_message(target, property, null, apiobj.type, retval, apiobj.hooked)
                    );
                }

                return retval;
            }
        },

        set (target, orig_property, value) {

            const property = orig_property.toLowerCase(),
                  apiobj   = {
                      name: target.__name__,
                      property: property,
                      original_property: orig_property,
                      id: target.__id__,
                      type: "setter"
                  };

            if (/^__(?:name|id)__$/i.test(property)) {
                return Reflect.set(target, property, value);
            }

            //context.emitter.emit("debug.getprop", Object.assign({}, apiobj, { args: [value] }));
            context.emitter.emit("debug.getprop", apiobj);

            const retval = try_run_hook(context, apiobj, () => Reflect.set(target, property, value));
            context.emitter.emit(
                "runtime.api.setter",
                make_emitter_message(target, property, value, apiobj.type, retval, apiobj.hooked)
            );

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
