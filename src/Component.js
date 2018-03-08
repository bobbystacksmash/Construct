class Component {

    constructor (context, tag) {

	// All validation is done here!  For now, let's just assume
	// everything has worked correctly...

	if (! context.epoch) {
	    throw new Error("Component creation failed - no epoch defined.");
	}

	if (! context.emitter) {
	    throw new Error("Component creation failed - no event emitter defined.");
	}

	this.context = context;

	this.context.emitter.emit(`@${tag}::new`, arguments);
    }

    get emitter () {
	return this._emitter;
    }

    
    get epoch () {
	return this._epoch;
    }
}


module.exports = Component;
