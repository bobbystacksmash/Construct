/* The transpiler takes in JScript code and spools out JavaScript. */
const assert = require("chai").assert,
      cstsc  = require("../../../src/lib/cstsc");


describe("Construct's Source-To-Source Compiler", () => {

    describe("Removing '@cc_on'", () => {

        it("should remove a '@cc_on' literals", () => {
            assert.equal(cstsc.transpile(`@cc_on`), "");
        });

        it("should ignore '@cc_on' when inside a double-quoted string", () => {
            assert.equal(cstsc.transpile(`"@cc_on"`), `"@cc_on"`);
        });

        it("should ignore '@cc_on' when inside a single-quoted string", () => {
            assert.equal(cstsc.transpile(`'@cc_on'`), `'@cc_on'`);
        });

        it("should ignore '@cc_on' when inside a comment", () => {
            assert.equal(cstsc.transpile(`// @cc_on`), `// @cc_on`);
        });

        it("should ignore '@cc_on' when inside a multi-line comment", () => {
            assert.equal(cstsc.transpile(`/* @cc_on */`), `/* @cc_on */`);
        });
    });

    describe("Transpiling @if statements", () => {

        it("should ignore an existing JS if", () => {
            const code = `if (true) WScript.Echo("Hello!");`;
            assert.equal(cstsc.transpile(code), code);
        });

        it("should convert a literal @if to a JS if", () => {
            assert.equal(
                cstsc.transpile(`@if (true) WScript.Echo("Hello!"); @end`),
                `if (true) { WScript.Echo("Hello!"); }`
            );
        });

        it("should handle complex paren-groups within '@if (<--HERE>--)'", () => {
            assert.equal(
                cstsc.transpile(`@if ((true || false) || ((2))) WScript.Echo("Hello!"); @end`),
                cstsc.transpile(`if ((true || false) || ((2))) { WScript.Echo("Hello!"); }`),
            );
        });

        it("should ignore parens within double-quoted strings inside the @if-test", () => {
            assert.equal(
                cstsc.transpile(`@if ("()()()") WScript.Echo("Hello!"); @end`),
                `if ("()()()") { WScript.Echo("Hello!"); }`
            );
        });

        it("should ignore parens within single-quoted strings inside the @if-test", () => {
            assert.equal(
                cstsc.transpile(`@if (/* () () */ true) WScript.Echo("Hello!"); @end`),
                cstsc.transpile(`if (/* () () */ true) { WScript.Echo("Hello!"); }`),
            );
        });

        it("should ignore parens inside multi-line comments within the @if-test", () => {
            assert.equal(
                cstsc.transpile(`@if (/* () () */ true) WScript.Echo("Hello!"); @end`),
                `if (/* () () */ true) { WScript.Echo("Hello!"); }`,
            );
        });
    });

    describe("Handling /*@ ... @*/ comments", () => {

    });
});
