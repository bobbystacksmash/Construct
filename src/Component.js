class Component {

    constructor (context) {

	// All validation is done here!  For now, let's just assume
	// everything has worked correctly...

	if (! context.epoch) {
	    throw new Error("Component creation failed - no epoch defined.");
	}

	if (! context.emitter) {
	    throw new Error("Component creation failed - no event emitter defined.");
	}

	this.context = context;
    }

    get emitter () {
	return this._emitter;
    }

    
    get epoch () {
	return this._epoch;
    }
}


module.exports = Component;
