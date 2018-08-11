
function try_run_hook (context, apiobj, default_action) {

    let hook   = context.find_hook(apiobj),
        result = undefined;

    if (hook) {
        apiobj.hooked = true;
        return hook(default_action);
    }
    else if (typeof default_action === "function") {
        return default_action();
    }
    else {
        return default_action;
    }
}

function make_emitter_message (target, property, type, args, retval) {

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

    return {
        target:  target.__name__,
        id:      target.__id__,
        hooked:  false,
        type:    type,
        prop:    property,
        args:    args,
        return:  (retval === undefined) ? null : retval
    };
}

module.exports = function (context, jscript_class) {

    const proxyobj = {
        get (target, orig_property) {

            const property = orig_property.toLowerCase(),
                  objprop  = target[property],
                  apiobj   = {
                      name: target.__name__,
                      property: property,
                      original_property: orig_property,
                      id:   target.__id__,
                      args: null
                  };

            if (typeof objprop === "function") {
                return function (...args) {

                    apiobj.args = [...args];
                    const retval = try_run_hook(context, apiobj, () => jscript_class[property](...args));

                    if (/^__(?:name|id)__$/.test(property) === false) {
                        context.emitter.emit(
                            `${target}.${property}`,
                            make_emitter_message(target, property, "method", [...args], retval)
                        );
                    }

                    return retval;
                };
            }
            else {

                const retval = try_run_hook(context, apiobj, objprop);

                if (/^__(?:name|id)__$/.test(property) === false) {
                    context.emitter.emit(
                        `${target}.${property}`,
                        make_emitter_message(target, property, "getter", null, retval)
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
                      id: target.__id__
                  };

            const retval = try_run_hook(context, apiobj, () => Reflect.set(target, property, value));

            if (/^__(?:name|id)__$/.test(property) === false) {
                context.emitter.emit(
                    `${target}.${property}`,
                    make_emitter_message(target, property, "setter", value, retval)
                );
            }

            return retval;
        }
    };

    return new Proxy(jscript_class, proxyobj);
};
