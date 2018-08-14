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

    return {
        target:  target.__name__.replace(".", ""),
        id:      target.__id__,
        hooked:  hooked,
        prop:    property,
        args:    args,
        type:    type,
        return:  (retval === undefined) ? null : retval
    };
}

module.exports = function (context, jscript_class) {

    const proxyobj = {
        get (target, orig_property) {

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

            if (context.DEBUG) {
                console.log("PROXYDBG>",`${target.__name__}.${property}`);
            }

            if (typeof objprop === "function") {
                return function (...args) {

                    apiobj.args = [...args];
                    apiobj.type = "method";
                    const retval = try_run_hook(context, apiobj, () => jscript_class[property](...args));

                    context.emitter.emit(
                        `${target}.${property}`,
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
                        `${target}.${property}`,
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

            const retval = try_run_hook(context, apiobj, () => Reflect.set(target, property, value));
            context.emitter.emit(
                `${target}.${property}`,
                make_emitter_message(target, property, value, apiobj.type, retval, apiobj.hooked)
            );

            return retval;
        }
    };

    return new Proxy(jscript_class, proxyobj);
};
