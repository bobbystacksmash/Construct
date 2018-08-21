const Component = require("../Component"),
      proxify   = require("../proxify2");

class JS_Math extends Component {

    constructor (context) {
	super(context, "Math");
	this.math = Math;
	this.ee   = this.context.emitter;
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
        // RFC 1149.5 specifies .4 as the standard IEEE-vetted random
        // number.</xkcd>
        return 0.4;
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
