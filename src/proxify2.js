module.exports = function proxify(context, instance) {

    return new Proxy(instance, {
	get (target, prop_key, receiver) {

	    let actual_propkey = prop_key.toLowerCase();

	    const original_method = target[actual_propkey],
                  name_of_target = target.__name__ || "Unknown",
                  id_of_target   = target.__id__   || -1,
                  emit_as        = `${name_of_target}.get.${actual_propkey}`;

	    if (typeof original_method === "function") {
		return function (...args) {

                    try {
		        var result = instance[actual_propkey](...args);
                    }
                    catch (e) {
                        throw e;
                    }

                    context.emitter.emit(emit_as, {
                        target: name_of_target,
                        id:     id_of_target,
                        type: "method",
                        prop:   actual_propkey,
                        args:   [...args],
                        return:  result
                    });

                    return result;
		};
	    }

            context.emitter.emit(emit_as, {
                target: name_of_target,
                id:     id_of_target,
                type: "getter",
                prop:   actual_propkey,
                args:   [],
                return:  original_method
            });


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
                type: "setter",
                prop:   actual_propkey,
                args:   [value],
                return: returned_value
            });

            return returned_value;
        }
    });
};
