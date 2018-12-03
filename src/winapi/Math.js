const Component = require("../Component"),
      proxify   = require("../proxify2");

var next_random = (function () {
    let x = 0.01;
    return function () {

        if (x > 1) {
            x = 0;
        }
        x += 0.1;
        return x;
    };
}());

class JS_Math extends Component {

    constructor (context) {
	super(context, "Math");
        context.disable_event_tracking(this.__id__);
	this.math = Math;
    }

    // Properties
    get E () {
        return this.math.E;
    }

    get LN2 () {
        return this.math.LN2;
    }

    get LN10 () {
        return this.math.LN10;
    }

    get LOG2E () {
        return this.math.LOG2E;
    }

    get LOG10E () {
        return this.math.LOG10E;
    }

    get PI () {
        return this.math.PI;
    }

    get SQRT2 () {
        return this.math.SQRT2;
    }

    get SQRT1_2 () {
        return this.math.SQRT1_2;
    }


    // Methods

    abs (...args) {
        return this.math(...args);
    }

    acos (...args) {
        return this.math(...args);
    }


    acosh(...args) {
        return this.math.acosh(...args);
    }

    asin(...args) {
        return this.math.asin(...args);
    }

    asinh(...args) {
        return this.math.asinh(...args);
    }

    atan(...args) {
        return this.math.atan(...args);
    }

    atan2(...args) {
        return this.math.atan2(...args);
    }

    atanh(...args) {
        return this.math.atanh(...args);
    }

    cbrt(...args) {
        return this.math.cbrt(...args);
    }

    ceil(...args) {
        return this.math.ceil(...args);
    }

    cos(...args) {
        return this.math.cos(...args);
    }

    cosh(...args) {
        return this.math.cosh(...args);
    }

    exp(...args) {
        return this.math.exp(...args);
    }

    floor(...args) {
        return this.math.floor(...args);
    }

    log(...args) {
        return this.math.log(...args);
    }

    max(...args) {
        return this.math.max(...args);
    }

    min(...args) {
        return this.math.min(...args);
    }

    pow(...args) {
        return this.math.pow(...args);
    }

    random() {
        return next_random();
    }

    round(...args) {
        return this.math.round(...args);
    }

    sin(...args) {
        return this.math.sin(...args);
    }

    sinh(...args) {
        return this.math.sinh(...args);
    }

    sqrt(...args) {
        return this.math.sqrt(...args);
    }

    tan(...args) {
        return this.math.tan(...args);
    }

    tanh(...args) {
        return this.math.tanh(...args);
    }

    trunc(...args) {
        return this.math.trnuc(...args);
    }

    toString () {
        return this.math.toString();
    }
}


module.exports = function create(context) {
    let math = new JS_Math(context);
    return proxify(context, math);
};
