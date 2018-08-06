module.exports = function proxify(context, instance) {

    return new Proxy(instance, {
	get (target, prop_key, receiver) {

	    let actual_propkey = prop_key.toLowerCase();

	    const original_method = target[actual_propkey];

	    if (typeof original_method === "function") {
		return function (...args) {

                    const name_of_target = target.__name__ || "Unknown",
                          id_of_target   = target.__id__   || -1,
                          emit_as        = `${name_of_target}.get.${actual_propkey}`;

                    try {
		        var result = instance[actual_propkey](...args);
                    }
                    catch (e) {
                        throw e;
                    }

                    context.emitter.emit(emit_as, {
                        target: name_of_target,
                        id:     id_of_target,
                        type: "get",
                        prop:   actual_propkey,
                        args:   [...args],
                        return:  result
                    });

                    return result;
		};
	    }

	    return original_method;
	},

        set (target, prop_key, value) {

            const actual_propkey = prop_key.toLowerCase(),
                  name_of_target = target.__name__ || "Unknown",
                  id_of_target   = target.__id__   || -1,
                  emit_as        = `${name_of_target}.set.${prop_key}`;

            const returned_value = Reflect.set(target, prop_key.toLowerCase(), value);

            context.emitter.emit(emit_as, {
                target: name_of_target,
                id:     id_of_target,
                type: "set",
                prop:   actual_propkey,
                args:   [value],
                return: returned_value
            });

            return returned_value;
        }
    });
};
