/*
 * https://docs.microsoft.com/en-us/scripting/javascript/reference/enumerator-object-javascript
 *
 * METHODS
 * =======
 *
 *  - atEnd https://docs.microsoft.com/en-us/scripting/javascript/reference/atend-method-enumerator-javascript
 *  - item https://docs.microsoft.com/en-us/scripting/javascript/reference/item-method-enumerator-javascript
 *  - moveFirst https://docs.microsoft.com/en-us/scripting/javascript/reference/movefirst-method-enumerator-javascript
 *  - moveNext https://docs.microsoft.com/en-us/scripting/javascript/reference/movenext-method-enumerator-javascript
 *
 */

const proxify   = require("../proxify2");
const Component = require("../Component");

class JS_Enumerator extends Component {

    constructor (context, collection) {

        super(context, "Enumerator");
        this.context = context;

        this.ee  = this.context.emitter;
        this.vfs = this.context.vfs;

        this.collection = collection;
        this.ptr = 0;
    }

    atend () {

        if (this.collection === undefined)            return true;
        else if (this.ptr >= (this.collection.length - 1)) return true;
        else if (this.collection.length === 0)        return true;

        return false;
    }

    item () {

        if (this.collection.length === 0)       return undefined;
        else if (this.collection === undefined) return undefined;
        else if (this.ptr > this.collection.length)  return undefined;

        return this.collection[this.ptr];
    }

    movefirst () {
        this.ptr = 0;
    }

    movenext () {
        this.ptr++;
    }
}

module.exports = function create(context, items) {
    let enumerator = new JS_Enumerator(context, items);
    return proxify(context, enumerator);
};
