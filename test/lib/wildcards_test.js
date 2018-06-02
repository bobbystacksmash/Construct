const assert = require("chai").assert;

const wildcard_match = require("../../lib/winwc/interpreter");


describe("Wildcard Matcher", () => {

    describe("< DOS_STAR (also known as '*')", () => {

        it("should match all when used on its own", () => {

            let filenames = [
                "foo", "bar", "hello_world", "test.txt", "foo.bar.baz"
            ];

            filenames.forEach(f => assert.isTrue(wildcard_match("<", f)));
        });

        it("should match zero times successfully", () => {

            let wildcards = [
                "foo.txt<", "foo.tx<t", "foo.t<xt", "foo.<txt",
                "foo<.txt", "fo<o.txt", "f<oo.txt", "<foo.txt"
            ];

            wildcards.forEach(w => assert.isTrue(wildcard_match(w, "foo.txt"), `Matching: PAT(${w}) to FILENAME(foo.txt)`));
        });
    });
});
