const assert            = require("chai").assert,
      VirtualFileSystem = require("../../src/runtime/virtfs"),
      WshUnnamed        = require("../../src/winapi/WshUnnamed"),
      make_ctx          = require("../testlib");

var ctx = null;
function make_context (...args) {
    ctx = make_ctx(...args);
}

describe("WshEnvironment", () => {

    beforeEach(function () {
        ctx = make_ctx();
    });

    describe("Construction", () => {

        it("should return a WshEnvironment instance", () => {

        });
    });
});
