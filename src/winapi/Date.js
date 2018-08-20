
const Component = require("../Component"),
      proxify   = require("../proxify2");

class JS_Date extends Component {

    constructor (context, dtstr) {
	super(context, "Date");
	this.date = new Date(this.context.epoch, dtstr);
	this.ee   = this.context.emitter;
    }


    skew (ms) {
	this.context.epoch += ms;
    }


    getdate () {

	let dt = this.date.getDate();

	this.ee.emit("@Date::getDate", {
	    fn: "getDate",
	    v: dt
	});

	return dt;
    }


    getmonth () {

	let dt = this.date.getMonth();

	this.ee.emit("@Date::getMonth", {
	    fn: "getMonth",
	    v: dt
	});

	return dt;
    }


    getyear () {

	let dt = this.date.getYear() + 1900;

	this.ee.emit("@Date::getYear", {
	    fn: "getYear",
	    v: dt
	});

	return dt;
    }


    gethours () {

	let dt = this.date.getHours();

	this.ee.emit("@Date::getHours", {
	    fn: "getHours",
	    v: dt
	});

	return dt;
    }

    getminutes () {

	let dt = this.date.getMinutes();

	this.ee.emit("@Date::getMinutes", {
	    fn: "getMinutes",
	    v: dt
	});

	return dt;
    }


    getseconds () {

	let dt = this.date.getSeconds();

	this.ee.emit("@Date::getSeconds", {
	    fn: "getSeconds",
	    v: dt
	});

	return dt;
    }


    gettime () {

	let dt = this.date.getTime();

	this.ee.emit("@Date::getTime", {
	    fn: "getTime",
	    v: dt
	});

	return dt;
    }

    tostring () {
        return this.date.toString();
    }
}


module.exports = function create(context) {

    return function dt (dtstr) {
        var date = new JS_Date(context, dtstr);
        return proxify(context, date);
    };
};
