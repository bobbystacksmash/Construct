const assert   = require("chai").assert,
      wildcard = require("../../src/runtime/wildcard");

describe("Wildcard Matcher", () => {

    describe("DOS_STAR - matches zero or more chars until matching the final period", () => {

        it("should match all files which do not contin a period", () => {

            let files = ["foo", "ab", "hello.txt", "sailing", "abc.txt", "1.2.3"],
                tests = [
                    { pattern: "<", expected: ["foo", "ab", "sailing"] }
                ];

            tests.forEach(t => assert.deepEqual(wildcard.match(files, t.pattern), t.expected));
        });

        it("should match all files when the pattern is '<<'", () => {

            let files = ["foo", "hello.txt", "world.c", "bz", "a.1.2"],
                tests = [
                    { pattern: "<<", expected: files }
                ];

            tests.forEach(t => assert.deepEqual(wildcard.match(files, t.pattern), t.expected));
        });

        it("should greedily match the dot", () => {

            assert.deepEqual(
                wildcard.match(["foo.txt", "hello.txt", "b0rk.txt"], "<txt"),
                ["foo.txt", "hello.txt", "b0rk.txt"]
            );
        });

        it("should match if used after the last dot", () => {

            assert.deepEqual(
                wildcard.match(["foo.txt", "foo.txt.1", "hello.c", "test.tx", "bar.txt.gz"], "foo.<"),
                ["foo.txt"]
            );
        });
    });

    describe("DOS_QM", () => {

        it("should match any single character", () => {

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

        it("should match zero if to the left of a period", () => {

            let files = ["foo.txt", "barr.txt"],
                tests = [
                    { pattern: "foo>.txt", expected: ["foo.txt"] },
                    { pattern: "foo>>>>>>>>>>>>>>>>>>>.txt", expected: ["foo.txt"] }
                ];

            tests.forEach(t => {
                assert.deepEqual(wildcard.match(files, t.pattern), t.expected);
            });
        });

        it("should match zero if at the end of a string", () => {

            let files = ["foo.txt", "barr.txt"],
                tests = [
                    { pattern: "foo.txt>", expected: ["foo.txt"] },
                    { pattern: "foo.txt>>>>>>>", expected: ["foo.txt"] }
                ];

            tests.forEach(t => {
                assert.deepEqual(wildcard.match(files, t.pattern), t.expected);
            });
        });

        it("should match when used contiguously", () => {

            let files = ["a", "ab", "abc", "hello", "testing"],
                tests = [
                    { pattern: ">>>>>>>>", expected: ["a", "ab", "abc", "hello", "testing"] }
                ];

            tests.forEach(t => {
                assert.deepEqual(wildcard.match(files, t.pattern), t.expected);
            });
        });

        it("should match files with a leading '.'", () => {

            let files = ["manife~1"],
                tests = [
                    { pattern: ">>>>>>>>", expected: ["manife~1"] }
                ];

            tests.forEach(t => {
                assert.deepEqual(wildcard.match(files, t.pattern), t.expected);
            });
        });
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

    describe("LITERALS - any character that isn't a metachar", () => {

        it("should match literals", () => {

            let files = ["foo", "HELLOW~1", "HelloWorld"],
                tests = [
                    { pattern: "foo", expected: ["foo"] }
                ];

            tests.forEach(
                t => assert.deepEqual(wildcard.match(files, t.pattern), t.expected)
            );
        });

    });
});
