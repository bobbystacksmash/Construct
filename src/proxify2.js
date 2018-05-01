module.exports = function proxify(context, instance) {

    return new Proxy(instance, {
	get (target, prop_key, receiver) {

	    let actual_propkey = prop_key.toLowerCase();

	    context.emitter.emit("$DEBUG::proxy-translate", {
		prop_from: prop_key,
		prop_to:   actual_propkey
	    });

	    if (context.DEBUG) {
		console.log(`PROXDBG> ${prop_key}`);
	    }


	    const original_method = target[actual_propkey];

	    if (typeof original_method === "function") {
		return function (...args) {
		    let result = instance[actual_propkey](...args);
		    return result;
		};
	    }

	    return original_method;
	},

        set (obj, prop, value) {
            return Reflect.set(obj, prop.toLowerCase(), value);
        }
    });
};
