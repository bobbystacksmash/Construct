
const Component = require("../Component"),
      proxify   = require("../proxify2");

const DATE = Date;

class JS_Date extends Component {

    constructor (context, dtstr) {
	super(context, "Date");
	this.date = new DATE(this.context.epoch);
	this.ee   = this.context.emitter;
    }


    skew (ms) {
	this.context.epoch += ms;
    }


    getdate () {
	let dt = this.date.getDate();
	return dt;
    }


    getmonth () {
	let dt = this.date.getMonth();
	return dt;
    }


    getyear () {
	let dt = this.date.getYear() + 1900;
	return dt;
    }


    gethours () {
	let dt = this.date.getHours();
	return dt;
    }

    getminutes () {
	let dt = this.date.getMinutes();
	return dt;
    }


    getseconds () {
	let dt = this.date.getSeconds();
	return dt;
    }


    gettime () {

	let dt = this.date.getTime();
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
