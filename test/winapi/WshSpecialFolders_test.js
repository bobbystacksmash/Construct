const assert            = require("chai").assert,
      WshSpecialFolders = require("../../src/winapi/WshSpecialFolders"),
      make_ctx          = require("../testlib");

var ctx = null;
function make_context (...args) {
    ctx = make_ctx(...args);
}

describe("WshSpecialFolders", () => {

    beforeEach(function () {
        make_context({
            config: {
                environment: {
                    whoami: "SomeUser"
                }
            }
        });
    });

    describe("Construction", () => {

        it("should support creating a SpecialFolders instance", () => {
            assert.doesNotThrow(() => new WshSpecialFolders(ctx));
        });
    });

    describe("#Count", () => {

        it("should return the number of items in the collection", () => {
            assert.equal(new WshSpecialFolders(ctx).count(), 18);
        });

        // TODO: Pass args to #count, see when it throws.
    });

    describe("#Item", () => {

        it("should return the item by index, or by name", () => {

            const specdirs = new WshSpecialFolders(ctx);
            assert.equal(specdirs.Item(0), specdirs.Item("AllUsersDesktop"));

            assert.equal(specdirs.Item(0), "C:\\Users\\Public\\Desktop");
        });

        // TODO: what if we don't know the index?
        // TODO: what if the var doesn't exist?
    });

    describe(".Length", () => {

        it("should have equal .Length and .Count() values", () => {
            const specdirs = new WshSpecialFolders(ctx);
            assert.equal(specdirs.length, specdirs.count());
        });

        // TODO: what if we assign to the length?
    });
});
