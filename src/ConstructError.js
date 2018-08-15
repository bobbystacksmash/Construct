const WordWrap = require("word-wrap");

class ConstructError extends Error {

    constructor (errobj) {
        super(errobj.summary);
        this.err = errobj;
        Error.captureStackTrace(this, ConstructError);
    }

    get source () {
        return this.err.source;
    }

    get summary () {
        return this.err.summary;
    }

    get description () {
        return this.err.description;
    }

    formatted () {
        return WordWrap(this.description, {width: 72});
    }
}

module.exports = ConstructError;
