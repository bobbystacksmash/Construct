const assert            = require("chai").assert,
      WshSpecialFolders = require("../../src/winapi/WshSpecialFolders"),
      make_ctx          = require("../testlib");

const CONFIG = {
    environment: {
        whoami: "SomeUser"
    }
};

var ctx = null;
function make_context (...args) {
    ctx = make_ctx(...args);
}

describe("WshSpecialFolders", () => {

    beforeEach(function () {
        make_context({
            config: CONFIG
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

        it("should throw when an arg is passed to .count()", () => {

            make_context({
                config: CONFIG,
                exceptions: {
                    throw_wrong_argc_or_invalid_prop_assign: () => {
                        throw new Error("no args to count");
                    }
                }
            });

            assert.doesNotThrow(() => new WshSpecialFolders(ctx).count());
            assert.throws(() => new WshSpecialFolders(ctx).count(1, 2), "no args to count");
        });
    });

    describe("#Item", () => {

        it("should return the item by index, or by name", () => {

            const specdirs = new WshSpecialFolders(ctx);
            assert.equal(specdirs.Item(0), specdirs.Item("AllUsersDesktop"));
            assert.equal(specdirs.Item(0), "C:\\Users\\Public\\Desktop");
        });

        it("should return an empty string if the variable is unknown", () => {
            assert.equal(new WshSpecialFolders(ctx).item("tmp "),   ""); // <-- trailing spc.
            assert.equal(new WshSpecialFolders(ctx).item("foobar"), "");
        });

        it("should throw if no arguments are passed to .item", () => {

            make_context({
                config: CONFIG,
                exceptions: {
                    throw_wrong_argc_or_invalid_prop_assign: () => {
                        throw new Error("no args");
                    }
                }
            });

            assert.throws(() => new WshSpecialFolders(ctx).item(), "no args");
        });

        it("should throw a 'subscript out of range' err when reading beyond collection length", () => {

            make_context({
                config: CONFIG,
                exceptions: {
                    throw_subscript_out_of_range: () => {
                        throw new Error("out of range");
                    }
                }
            });

            const specdir = new WshSpecialFolders(ctx);

            for (var i = 0; i < specdir.length; i++) {
                assert.doesNotThrow(() => specdir.item(i));
            }

            assert.throws(() => specdir.item(i + 1), "out of range");
        });

        it("should throw a 'subscript out of range' err when reading negative numbers", () => {

            make_context({
                config: CONFIG,
                exceptions: {
                    throw_subscript_out_of_range: () => {
                        throw new Error("out of range");
                    }
                }
            });

            const specdir = new WshSpecialFolders(ctx);

            assert.throws(() => specdir.item(-1), "out of range");
            assert.throws(() => specdir.item(-10), "out of range");
        });

        it("should convert falsy values in to zero, and return that folder", () => {

            const specdir = new WshSpecialFolders(ctx),
                  zerodir = specdir.item(0);

            assert.equal(specdir.item(false), zerodir);
            assert.equal(specdir.item(null),  zerodir);
            assert.equal(specdir.item(undefined),  zerodir);
            assert.equal(specdir.item([]),  zerodir);
        });

        it("should throw a 'subscript out of range' error if passed 'true'", () => {

            make_context({
                config: CONFIG,
                exceptions: {
                    throw_subscript_out_of_range: () => {
                        throw new Error("out of range");
                    }
                }
            });

            assert.throws(() => new WshSpecialFolders(ctx).item(true), "out of range");
        });

        it("should convert any 'truthy' value in to index '0' and return that", () => {

            const truthy = [
                function () {},
                { a: true, b: true },
                /(?:bb|[^b]{2})/
            ];

            const first_item = new WshSpecialFolders(ctx).item(0);

            truthy.forEach(p => {
                assert.doesNotThrow(() => new WshSpecialFolders(ctx).item(p));
                assert.equal(new WshSpecialFolders(ctx).item(p), first_item);
            });
        });
    });

    describe(".Length", () => {

        it("should have equal .Length and .Count() values", () => {
            const specdirs = new WshSpecialFolders(ctx);
            assert.equal(specdirs.length, specdirs.count());
        });

        it("should throw when attempting to assign to .length", () => {
            make_context({
                config: CONFIG,
                exceptions: {
                    throw_wrong_argc_or_invalid_prop_assign: () => {
                        throw new Error("cannot assign to length");
                    }
                }
            });

            assert.throws(() => new WshSpecialFolders(ctx).length = 12, "cannot assign to length");
        });
    });
});
