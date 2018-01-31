
function Date (ctx) {

    this.epoch = ctx.epoch;
    this.ee    = ctx.emitter;
    this.date  = ctx.date;

    this._id = ctx.register("Date", this, ctx);

    return this;
}


Date.prototype.skew = function (ms) {
    this.epoch_ms += ms;
};

Date.prototype.getDate = function () {

    let dt = this.date.getDate();

    ee.emit("@Date::getDate", {
	fn: "getDate",
	v: dt
    });

    return dt;
};


Date.prototype.getMonth = function () {

    let dt = this.date.getMonth();
    
    ee.emit("@Date::getMonth", {
	fn: "getMonth",
	v: dt
    });

    return dt;
};


Date.prototype.getYear = function () {

    let dt = this.date.getYear() + 1900;

    ee.emit("@Date::getYear", {
	fn: "getYear",
	v: dt
    });

    return dt;
};


Date.prototype.getHours = function () {

    let dt = this.date.getHours();

    ee.emit("@Date::getHours", {
	fn: "getHours",
	v: dt
    });

    return dt;
};


Date.prototype.getMinutes = function () {

    let dt = this.date.getMinutes();

    ee.emit("@Date::getMinutes", {
	fn: "getMinutes",
	v: dt
    });

    return dt;
};


Date.prototype.getSeconds = function () {

    let dt = this.date.getSeconds();

    ee.emit("@Date::getSeconds", {
	fn: "getSeconds",
	v: dt
    });

    return dt;
};


Date.prototype.getTime = function () {

    let dt = this.date.getTime();

    ee.emit("@Date::getTime", {
	fn: "getTime",
	v: dt
    });

    return dt;
};


module.exports = Date;
