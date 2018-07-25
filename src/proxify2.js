module.exports = function proxify(context, instance) {

    return new Proxy(instance, {
	get (target, prop_key, receiver) {

	    let actual_propkey = prop_key.toLowerCase();

	    /*context.emitter.emit("$DEBUG::proxy-translate", {
		prop_from: prop_key,
		prop_to:   actual_propkey
	    });*/

	    const original_method = target[actual_propkey];

	    if (typeof original_method === "function") {
		return function (...args) {

                    const name_of_target = target.__name__ || "Unknown",
                          emit_as        = `${name_of_target}.get.${actual_propkey}`;

                    context.emitter.emit(emit_as, {
                        target: name_of_target,
                        getset: "get",
                        prepost: "pre",
                        prop:   actual_propkey,
                        args:   [...args],
                        retval: null
                    });

	            /*if (context.DEBUG) {
		        console.log(`PROXDBG> ${emit_as}`);
	            }*/

                    try {
		        let result = instance[actual_propkey](...args);

                        context.emitter.emit(emit_as, {
                            target: name_of_target,
                            getset: "get",
                            prepost: "post",
                            prop:   actual_propkey,
                            args:   [...args],
                            retval: result
                        });

                        return result;
                    }
                    catch (e) {
                        throw e;
                    }
		};
	    }

	    return original_method;
	},

        set (obj, prop, value) {
            return Reflect.set(obj, prop.toLowerCase(), value);
        }
    });
};
