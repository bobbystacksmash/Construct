const assert     = require("assert");
const Enumerator = require("../../src/winapi/Enumerator");
const VirtualFileSystem = require("../../src/runtime/virtfs");
const make_ctx = require("../testlib");


describe("Enumerator class", function () {

    describe("#atEnd()", (done) => {

        // From the MSFT docs:
        //
        // > The atEnd method returns true if the current item is the last one
        // > in the collection, the collection is empty, or the current item is
        // > undefined. Otherwise, it returns false.
        it("should return true if the current item is the last one", () => {
            const ctx = make_ctx();

            let enumerator = new Enumerator(ctx, [1]);
            assert.equal(enumerator.atEnd(), true);
        });

        it("should return true if the collection is empty.", () => {
            let enumerator = new Enumerator(make_ctx(), []);
            assert.equal(enumerator.atEnd(), true);
        });

        it("should return true if the collection is undefined.", () => {

            const ctx = make_ctx();

            var enumerator = new Enumerator(ctx);
            assert.equal(enumerator.atEnd(), true);

            enumerator = new Enumerator(ctx);
            assert.equal(enumerator.atEnd(), true);
        });
    });

    describe("#item()", (done) => {

        // From the MSFT docs:
        //
        // * https://docs.microsoft.com/en-us/scripting/javascript/reference/item-method-enumerator-javascript
        //
        // > The item method returns the current item. If the collection is
        // > empty or the current item is undefined, it returns undefined.
        it("should return the current item.", () => {

            const ctx = make_ctx();

            let collection = [1, 2, 3],
                enumerator = new Enumerator(ctx, collection);

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
        });
    });

    describe("#moveFirst()", () => {

        it("should reset the internal collection index to the first item", () => {

            const ctx = make_ctx();

            let collection = [1, 2, 3],
                enumerator = new Enumerator(ctx, collection);

            assert.equal(enumerator.item(), collection[0]);

            enumerator.moveNext();
            assert.equal(enumerator.item(), collection[1]);

            enumerator.moveFirst();
            assert.equal(enumerator.item(), collection[0]);

            for (let i = 0; i < 1000; i++) enumerator.moveNext();

            assert.equal(enumerator.item(), undefined);

            enumerator.moveFirst();
            assert.equal(enumerator.item(), collection[0]);
        });
    });

    describe("#moveNext()", () => {

        it("should move to the next element in the list when called.", () => {

            const ctx = make_ctx();

            let collection = [1, 2, 3],
                enumerator = new Enumerator(ctx, collection);

            assert.equal(enumerator.item(), collection[0]);

            enumerator.moveNext();
            assert.equal(enumerator.item(), collection[1]);


            enumerator.moveNext();
            assert.equal(enumerator.item(), collection[2]);

            enumerator.moveNext();
            assert.equal(enumerator.item(), undefined);
        });
    });
});
