const assert   = require("chai").assert,
      wildcard = require("../../src/runtime/wildcard");

describe("Wildcard Matcher", () => {

    it("should match literals", () => {

        let files = ["foo", "HELLOW~1", "HelloWorld"],
            tests = [
                { pattern: "foo", expected: ["foo"] }
            ];

        tests.forEach(t => assert.deepEqual(wildcard.match(files, t.pattern), t.expected));
    });

    it("should match wildcards", () => {

        let files = ["foo", "HELLOW~1", "HelloWorld"],
            tests = [
                { pattern: "f??", expected: ["foo"] }
            ];

        tests.forEach(t => assert.deepEqual(wildcard.match(files, t.pattern), t.expected));
    });
});
