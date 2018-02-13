const assert     = require("assert");
const Enumerator = require("../../src/winapi/Enumerator")({
    emitter: {
        on   : () => {},
        emit : () => {},
    }});;

describe("Enumerator class", function () {

    describe("#new", function () {

        it("create an Enumerator instance when given an undefined collection.", (done) => {
            let enumerator = new Enumerator(undefined);
            assert.equal(typeof enumerator, "object");
            done();
        });

        it("create an Enumerator instance when an empty array is provided.", (done) => {
            let enumerator = new Enumerator([]);
            assert.equal(typeof enumerator, "object");
            done();
        });

        it("create an Enumerator instance when given a one-element array.", (done) => {
            let enumerator = new Enumerator([1]);
            assert.equal(typeof enumerator, "object");
            done();
        });
    });

    describe("#atEnd()", (done) => {

        // From the MSFT docs:
        // 
        // > The atEnd method returns true if the current item is the last one
        // > in the collection, the collection is empty, or the current item is
        // > undefined. Otherwise, it returns false. 
        it("should return true if the current item is the last one", (done) => {
            let enumerator = new Enumerator([1]);
            assert.equal(enumerator.atEnd(), true);
            done();
        });

        it("should return true if the collection is empty.", (done) => {
            let enumerator = new Enumerator([]);
            assert.equal(enumerator.atEnd(), true);
            done();
        });

        it("should return true if the collection is undefined.", (done) => {
            var enumerator = new Enumerator(undefined);
            assert.equal(enumerator.atEnd(), true);

            enumerator = new Enumerator();
            assert.equal(enumerator.atEnd(), true);

            done();
        });
    });

    describe("#item()", (done) => {

        // From the MSFT docs:
        //
        // * https://docs.microsoft.com/en-us/scripting/javascript/reference/item-method-enumerator-javascript
        //
        // > The item method returns the current item. If the collection is
        // > empty or the current item is undefined, it returns undefined. 
        it("should return the current item.", (done) => {
            let collection = [1, 2, 3],
                enumerator = new Enumerator(collection);

            assert.equal(enumerator.item(), collection[0]);
            enumerator.moveNext();

            assert.equal(enumerator.item(), collection[1]);
            enumerator.moveNext();

            assert.equal(enumerator.item(), collection[2]);
            enumerator.moveNext();

            enumerator.moveNext();
            enumerator.moveNext();
            enumerator.moveNext();
            enumerator.moveNext();
            enumerator.moveNext();
            enumerator.moveNext();

            assert.equal(enumerator.item(), undefined);

            enumerator.moveFirst();
            assert.equal(enumerator.item(), collection[0]);

            done();
        });
    });

    describe("#moveFirst()", (done) => {

        it("should reset the internal collection index to the first item", (done) => {

            let collection = [1, 2, 3],
                enumerator = new Enumerator(collection);

            assert.equal(enumerator.item(), collection[0]);

            enumerator.moveNext();
            assert.equal(enumerator.item(), collection[1]);

            enumerator.moveFirst();
            assert.equal(enumerator.item(), collection[0]);

            for (let i = 0; i < 1000; i++) enumerator.moveNext();

            assert.equal(enumerator.item(), undefined);

            enumerator.moveFirst();
            assert.equal(enumerator.item(), collection[0]);

            done();
        });
    });

    describe("#moveNext()", (done) => {

        it("should move to the next element in the list when called.", (done) => {

            let collection = [1, 2, 3],
                enumerator = new Enumerator(collection);

            assert.equal(enumerator.item(), collection[0]);

            enumerator.moveNext();
            assert.equal(enumerator.item(), collection[1]);


            enumerator.moveNext();
            assert.equal(enumerator.item(), collection[2]);

            enumerator.moveNext();
            assert.equal(enumerator.item(), undefined);

            done();
        });
    });
});
