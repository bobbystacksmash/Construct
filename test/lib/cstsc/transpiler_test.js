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

        it("should handle @if, @elif, @else, and @end tags in one conditional", () => {
            assert.equal(
                cstsc.transpile(`@if (true) return 1 @elif (true) return 2 @else return 3 @end`),
                `if (true) { return 1 } else if (true) { return 2 } else { return 3 }`
            );
        });

        it("should correctly handle comments just after the @if-test group", () => {
            assert.equal(
                cstsc.transpile(`@if (@_win32 || @_win64)/* B  */`),
                `if (true || true) {/* B  */`
            );
        });
    });

    describe("Handling /*@ ... @*/ comments", () => {

        it("should remove surrounding CC comments from an @if", () => {
            const code = `@cc_on /*@if (true) WScript.Echo("Hello!"); @end @*/`,
                  trans_code = cstsc.transpile(code).replace(/^\s*|\s*$/g, "");
            assert.equal(trans_code, `if (true) { WScript.Echo("Hello!"); }`);
        });

        it("should handle a '/*@cc_on ...' opening with an @if", () => {
            const code = `/*@cc_on @if (true) WScript.Echo("Hello!"); @end @*/`;
            assert.equal(
                cstsc.transpile(code).replace(/^\s*|\s*$/g, ""),
                `if (true) { WScript.Echo("Hello!"); }`
            );
        });

        it("should transpile mixed comments and not become confused with '@*//* ... */'", () => {
            const code = `/*@cc_on /* A */ @if (@_win32)/* B */x = true; @*//* G */`;
            assert.equal(
                cstsc.transpile(code),
                ` /* A */ if (true) {/* B */x = true; /* G */`
            );
        });
    });
});
