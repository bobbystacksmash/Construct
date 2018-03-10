module.exports = function proxify(context, instance) {

    return new Proxy(instance, {
	get (target, propKey, receiver) {
	    
	    let actual_propkey = propKey.toLowerCase();

	    context.emitter.emit("$DEBUG::proxy-translate", {
		prop_from: propKey,
		prop_to:   actual_propkey
	    });
	    
	    const original_method = target[actual_propkey];
	    return function (...args) {
		let result = instance[actual_propkey](...args);
		return result;
	    };
	}
    });
};

