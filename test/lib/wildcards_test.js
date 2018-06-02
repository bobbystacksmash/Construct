const assert = require("chai").assert;

const wildcard_match = require("../../lib/winwc/interpreter");


describe("Wildcard Matcher", () => {

    describe("DOS_STAR(<)", () => {

        it("should match all when used on its own", () => {

            let filenames = [
                "foo", "bar", "hello_world", "test.txt", "foo.bar.baz"
            ];

            filenames.forEach(f => assert.isTrue(wildcard_match("<", f)));
        });

        it("should match zero times successfully", () => {

            let wildcards = [
                "foo.txt<", "foo.tx<t", "foo.t<xt", "foo.<txt",
                "foo<.txt", "fo<o.txt", "f<oo.txt", "<foo.txt",
            ];

            wildcards.forEach(w => assert.isTrue(wildcard_match(w, "foo.txt"), `Matching: PAT(${w}) to FILENAME(foo.txt)`));
        });

        it("should correctly handle multiple '<<<<'", () => {
            assert.isTrue(wildcard_match("f<<<<.txt", "foo.txt"));
            assert.isFalse(wildcard_match("f<<<.txt", "bar.txt"));
        });

        it("should match filenames ending with dots or without", () => {

            let filenames = [
                "foo", "foo.", "no_dot"
            ];

            filenames.forEach(fn => assert.isTrue(wildcard_match("<.", fn)));
        });
    });

    describe("> DOS_QM, also known as '?'", () => {

        it("should not match if middle char is '.'", () => {
            assert.isFalse(wildcard_match("a>c", "a.c"));
        });

        it("should match if repeated multiple times before the last '.'", () => {

            let matching_filenames = [
                "foo.exe", "bar.exe", "baz.exe"
            ];

            matching_filenames.forEach(fn => assert.isTrue(wildcard_match(">>>>.exe", fn)));
        });

        it("should match exactly one char", () => {

            let matching_filenames = [
                "f", "fo", "foo", "fox", "fod", "aaa", "xyz"
            ];

            let non_matching_filenames = [
                "abcd", "a.txt", "a.c"
            ];

            matching_filenames.forEach(fn => assert.isTrue(wildcard_match(">>>", fn)));
            non_matching_filenames.forEach(fn => assert.isFalse(wildcard_match(">>>", fn), `>>> ${fn}`));
        });

        it("should match if pattern is similar to '>>>>.>>>>'", () => {

            let matching_filenames = [
                "a.1", "ab.12", "abc.123", "abcd.1234",
                "abc."
            ];

            let non_matching_filenames = [
                "no_dot", "abcde.1234"
            ];

            matching_filenames.forEach(fn => assert.isTrue(wildcard_match(">>>>.>>>>", fn), `>>>>.>>>> ${fn}`));
            //matching_filenames.forEach(fn => assert.isFalse(wildcard_match(">>>>.>>>>", fn)));
        });

        it("should match either side of the dot", () => {
            assert.isTrue(wildcard_match(">.>", "a.c"));
        });

        it("should match with chars after the ext dot", () => {
            assert.isTrue(wildcard_match(">>>.txt", "foo.txt"));
        });
    });

    describe("'\"' DOS_DOT, matches literal dots or nothing if at the end of the string", () => {

        it("should match a dot", () => {
            assert.isTrue(wildcard_match('abc"""txt', "abc...txt"));
        });

        it("should match any dot, even at the end", () => {

            let matches = [
                { pattern: 'foo"txt',     filename: "foo.txt" },
                { pattern: 'a"1"b"2"txt', filename: "a.1.b.2.txt" },
                { pattern: 'a.1"b.2"txt', filename: "a.1.b.2.txt" },
            ];

            matches.forEach(m => assert.isTrue(wildcard_match(m.pattern, m.filename)));
        });

        it("should be ignored if at the end of a pattern", () => {
            assert.isTrue(wildcard_match('foo.txt"""', "foo.txt"));
        });
    });

    describe("ASTERISK(*) - greedy wildcard matcher, zero or more times", () => {

        it("should successfully match all of these patterns", () => {

            let matches = [
                "foo.txt", "NO_DOT", "a.b.c.d.e", "f", "hello", "any_char"
            ];

            matches.forEach(m => assert.isTrue(wildcard_match("*", m)));
        });

        it("should match if there are multiple ASTERISKS appearing together", () => {

            let matches = [
                "a", "aa", "aaa", "aaab", "aaa.txt", "foo_bar", "HELLO", "testing"
            ];

            matches.forEach(m => assert.isTrue(wildcard_match("****", m)));
        });
    });
});
