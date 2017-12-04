const EventEmitter = require("events");

module.exports = function () {
    let e = new EventEmitter();
    return {
        emit:   (...args) => { e.emit(...args)   },
        winapi: (x, y)    => { e.emit(x.e, x, y) },
        on:     (...args) => { e.emit(...args)   },
        onwinapi: (x, f)  => { e.on(x.e, f);     }
    }
};



