const assert   = require("chai").assert,
      wildcard = require("../../src/runtime/wildcard");

describe("Wildcard Matcher", () => {

    xit("should match literals", () => {

        let files = ["foo", "HELLOW~1", "HelloWorld"],
            tests = [
                { pattern: "foo", expected: ["foo"] }
            ];

        tests.forEach(
            t => assert.deepEqual(wildcard.match(files, t.pattern), t.expected)
        );
    });

    xit("should match wildcards", () => {

        let files = ["foo", "HELLOW~1", "HelloWorld"],
            tests = [
                { pattern: "f??", expected: ["foo"] }
            ];

        tests.forEach(
            t => assert.deepEqual(wildcard.match(files, t.pattern), t.expected)
        );
    });

    describe("DOS_DOT - matches a period of zero chars at EOS", () => {

        it("should match a literal dot", () => {

            let tests = [
                {
                    files: ["foo", "bar", "baz"],
                    pattern: "foo\"txt",
                    expected: ["foo"]
                },
                {
                    files: ["hello", "h.t", "foo"],
                    pattern: "h\"t",
                    expected: ["h.t"]
                },
                {
                    files: ["alpha", "bravo", "charlie"],
                    pattern: "alpha\"",
                    expected: ["alpha"]
                },
                {
                    files: ["hello", "world", "example"],
                    pattern: "alpha\"",
                    expected: []
                }
            ];

            tests.forEach(t => {
                opts = t.options || {};
                assert.deepEqual(
                    wildcard.match(t.files, t.pattern, opts), t.expected
                );
            });
        });
    });

});
