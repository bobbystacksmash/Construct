const proxify2 = require("./proxify2");
const evts     = require("./events");

let DATE = Date;

module.exports = function Date (opts) {

    opts = opts || {};

    var epoch_ms = opts.epoch || new DATE().getTime(),
        ee       = opts.emitter || { emit: () => {}, on: () => {} },
        dt   = () => new DATE(epoch_ms);

    function getYear() {
        return 1900 + dt().getYear();
    }

    let dateobj = {
        skew:       (m) => { epoch_ms += m },
        getDate:    ( )  => { let x = dt().getDate();    ee.emit("@Date::getDate",    { fn: "getDate",    v: x }); return x },
        getMonth:   ( )  => { let x = dt().getMonth();   ee.emit("@Date::getMonth",   { fn: "getMonth",   v: x }); return x },
        getYear:    ( )  => { let x = getYear();         ee.emit("@Date::getYear",    { fn: "getYear",    v: x }); return x },
        getHours:   ( )  => { let x = dt().getHours();   ee.emit("@Date::getHours",   { fn: "getHours",   v: x }); return x },
        getMinutes: ( )  => { let x = dt().getMinutes(); ee.emit("@Date::getMinutes", { fn: "getMinutes", v: x }); return x },
        getSeconds: ( )  => { let x = dt().getSeconds(); ee.emit("@Date::getSeconds", { fn: "getSeconds", v: x }); return x },
        getTime:    ( )  => { let x = dt().getTime();    ee.emit("@Date::getTime",    { fn: "getTime",    v: x }); return x }
    };

    return function () {
        return proxify2(dateobj, "Date", opts);
    };
}
