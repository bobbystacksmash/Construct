
const Component = require("../Component");

class JS_Date extends Component {

    constructor (context) {
	super(context, "Date");
	this.date = new Date(this.context.epoch);
	this.ee   = this.context.emitter;
    }


    skew (ms) {
	this.context.epoch += ms;
    }


    getDate() {

	let dt = this.date.getDate();

	this.ee.emit("@Date::getDate", {
	    fn: "getDate",
	    v: dt
	});

	return dt;
    }


    getMonth() {

	let dt = this.date.getMonth();

	this.ee.emit("@Date::getMonth", {
	    fn: "getMonth",
	    v: dt
	});

	return dt;
    }


    getYear() {

	let dt = this.date.getYear() + 1900;

	this.ee.emit("@Date::getYear", {
	    fn: "getYear",
	    v: dt
	});

	return dt;
    }


    getHours() {

	let dt = this.date.getHours();

	this.ee.emit("@Date::getHours", {
	    fn: "getHours",
	    v: dt
	});

	return dt;
    }

    getMinutes() {

	let dt = this.date.getMinutes();

	this.ee.emit("@Date::getMinutes", {
	    fn: "getMinutes",
	    v: dt
	});

	return dt;
    }


    getSeconds() {

	let dt = this.date.getSeconds();

	this.ee.emit("@Date::getSeconds", {
	    fn: "getSeconds",
	    v: dt
	});

	return dt;
    }


    getTime() {

	let dt = this.date.getTime();

	this.ee.emit("@Date::getTime", {
	    fn: "getTime",
	    v: dt
	});

	return dt;
    }

    toString () {
        return this.date.toString();
    }
}


module.exports = function create(context) {

    let dt = class Date extends JS_Date {
        constructor (d) {
            super(context, d);
        }
    };

    return dt;
};
