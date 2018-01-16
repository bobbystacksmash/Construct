const proxify2 = require("./proxify2");
const evts     = require("./events");

let DATE = Date;

module.exports = function Date (opts) {

    opts = opts || {};

    var epoch_ms = opts.epoch || new DATE().getTime(),
        ee       = opts.emitter || { emit: () => {}, on: () => {} },
        mkdate   = () => new DATE(epoch_ms);

    function getYear() {
        return 1900 + mkdate().getYear();
    }

    let dateobj = {
        skew:       (m) => { epoch_ms += m },
        getDate:    ( )  => { let x = mkdate().getDate();    ee.emit(evts.Date.getDate,    { fn: "getDate",    v: x }); return x },
        getMonth:   ( )  => { let x = mkdate().getMonth();   ee.emit(evts.Date.getMonth,   { fn: "getMonth",   v: x }); return x },
        getYear:    ( )  => { let x = getYear();             ee.emit(evts.Date.getYear,    { fn: "getYear",    v: x }); return x },
        getHours:   ( )  => { let x = mkdate().getHours();   ee.emit(evts.Date.getHours,   { fn: "getHours",   v: x }); return x },
        getMinutes: ( )  => { let x = mkdate().getMinutes(); ee.emit(evts.Date.getMinutes, { fn: "getMinutes", v: x }); return x },
        getSeconds: ( )  => { let x = mkdate().getSeconds(); ee.emit(evts.Date.getSeconds, { fn: "getSeconds", v: x }); return x },
        getTime:    ( )  => { let x = mkdate().getTime();    ee.emit(evts.Date.getTime,    { fn: "getTime",    v: x }); return x }
    };

    return function () {
        return proxify2(dateobj, "Date", opts);
    };
}
