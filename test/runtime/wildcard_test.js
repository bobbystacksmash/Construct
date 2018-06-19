const assert   = require("chai").assert,
      wildcard = require("../../src/runtime/wildcard");

describe("Wildcard Matcher", () => {

    describe("DOS_QM", () => {

        xit("should match any single character", () => {

            let files = ["faz.txt", "fez.txt", "abc", "aaa", "xyz"],
                tests = [
                    { pattern: "f>z.txt", expected: ["faz.txt", "fez.txt"] },
                    { pattern: ">>z.txt", expected: ["faz.txt", "fez.txt"] },
                    { pattern: ">>>", expected: ["abc", "aaa", "xyz"] },
                ];

            tests.forEach(t => {
                assert.deepEqual(wildcard.match(files, t.pattern), t.expected);
            });
        });

        xit("should match zero if to the left of a period", () => {

            let files = ["foo.txt", "barr.txt"],
                tests = [
                    { pattern: "foo>.txt", expected: ["foo.txt"] },
                    { pattern: "foo>>>>>>>>>>>>>>>>>>>.txt", expected: ["foo.txt"] }
                ];

            tests.forEach(t => {
                assert.deepEqual(wildcard.match(files, t.pattern), t.expected);
            });
        });

        xit("should match zero if at the end of a string", () => {

            let files = ["foo.txt", "barr.txt"],
                tests = [
                    { pattern: "foo.txt>", expected: ["foo.txt"] },
                    { pattern: "foo.txt>>>>>>>", expected: ["foo.txt"] }
                ];

            tests.forEach(t => {
                assert.deepEqual(wildcard.match(files, t.pattern), t.expected);
            });
        });

        xit("should match when used contiguously", () => {

            let files = ["a", "ab", "abc", "hello", "testing"],
                tests = [
                    { pattern: ">>>>>>>>", expected: ["a", "ab", "abc", "hello", "testing"] }
                ];

            tests.forEach(t => {
                assert.deepEqual(wildcard.match(files, t.pattern), t.expected);
            });
        });

        it("should match files with a leading '.'", () => {

            let files = [".manifest"],
                tests = [
                    { pattern: ">>>>>>>>", expected: [".manifest"] }
                ];

            tests.forEach(t => {
                assert.deepEqual(wildcard.match(files, t.pattern), t.expected);
            });
        });
    });

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

    xdescribe("DOS_DOT - matches a period of zero chars at EOS", () => {

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
