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

const proxify2 = require("../proxify2");

function Enumerator (ctx) {

    var ee = ctx.emitter;

    return function (collection) {

        let ptr = 0;

        collection = (collection && collection.constructor === Array) ? collection : undefined;

        function atEnd () {

            if (collection === undefined)            return true;
            else if (ptr >= (collection.length - 1)) return true;
            else if (collection.length === 0)        return true;

            return false;
        }

        function item () {

            if (collection.length === 0)       return undefined;
            else if (collection === undefined) return undefined;
            else if (ptr > collection.length)  return undefined;
            
            return collection[ptr];
        }

        function moveFirst () {
            ptr = 0;
        }

        function moveNext () {
            ptr++;
        }

        var Enumerator = {
            atEnd: atEnd,
            item: item,
            moveFirst: moveFirst,
            moveNext: moveNext
        };

        return proxify2(Enumerator, "Enumerator", ctx);
    }
}

module.exports = Enumerator;
