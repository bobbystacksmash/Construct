const assert   = require("chai").assert,
      JisonLex = require("jison-lex"),
      fs       = require("fs");

const /*LEXER_SRCFILE = "src/lib/cstsc/cc.l",*/
      LEXER_SRCFILE = "src/lib/cstsc/jscript.l",
      LEXER_GRAMMAR = fs.readFileSync(LEXER_SRCFILE, "utf-8");

var lexer;


const util = {

    positions: function (code) {

        let thislex = new JisonLex(LEXER_GRAMMAR),
            token   = null,
            tokens  = [];

        thislex.setInput(code);

        while (token !== 'EOF') {
            token = thislex.lex();
            tokens.push(token);
        }

        return tokens;
    },

    tokens: function (code) {

        let thislex = new JisonLex(LEXER_GRAMMAR),
            token   = null,
            tokens  = [];

        thislex.setInput(code);

        while (token !== 'EOF') {
            token = thislex.lex();
            if (typeof token === "object") {
                tokens.push(token.name);
            }
            else {
                tokens.push(token);
            }
        }

        return tokens;
    }
};

describe("CSTSC: Construct's Source-To-Source Compiler", () => {

    beforeEach(function () {
        lexer = new JisonLex(LEXER_GRAMMAR);
    });

    describe("Conditional Compilation", () => {
        //
        // For details, see `Enabling Conditional Compilation':
        //   https://github.com/bobbystacksmash/Construct/wiki/Construct-Source-To-Source-Compiler
        //
        describe("Enabling Conditional Compilation", () => {

            it("should detect a literal '@cc_on' statement.", () => {
                assert.deepEqual(
                    util.tokens(`@cc_on`), ["CC_ON", "EOF"]
                );
            });

            it("should ignore '@cc_on' when inside a double-quoted string", () => {
                assert.deepEqual(
                    util.tokens(`"@cc_on"`), ["EOF"]
                );
            });

            it("should ignore '@cc_on' when inside a single-quoted string", () => {
                assert.deepEqual(
                    util.tokens(`'@cc_on'`), ["EOF"]
                );
            });

            it("should ignore '@cc_on' when inside a single-line comment", () => {
                assert.deepEqual(util.tokens(`// @cc_on`), ["EOF"]);
            });

            it("should ignore '@cc_on' when inside a multi-line comment", () => {
                assert.deepEqual(util.tokens(`/* @cc_on */`), ["EOF"]);
            });

            it("should detect `/*@if (...` comments", () => {
                assert.deepEqual(
                    util.tokens(`@cc_on /*@if (true) WScript.Echo("Hello!"); @end @*/`),
                    ["CC_ON", "CC_CMNT_IF_OPEN", "CC_IF_CLOSE", "CC_ENDIF", "CC_CMNT_END", "EOF"]
                );
            });

            it("should detect an '/*@if' only AFTER CC is enabled", () => {
                assert.deepEqual(
                    util.tokens(`/*@cc_on @*/`),
                    ["CC_CMNT_CC_ON", "CC_CMNT_END", "EOF"]
                );
            });
        });

        describe("CC Comments", () => {

            it("should detect beginning and ending CC comments", () => {
                assert.deepEqual(
                    util.tokens(`@cc_on /*@ foo bar @*/`),
                    ["CC_ON", "CC_CMNT_END", "EOF"]
                );
            });

        });

        describe("Branching with @if, @else, and @end", () => {

            it("should paren-match correctly within an @if statement", () => {
                const code = `@if ((true) || (false || (true || false))) WScript.Echo("Hello!"); @end`;

                assert.deepEqual(
                    util.tokens(code),
                    ["CC_IF_OPEN", "CC_IF_CLOSE", "CC_ENDIF", "EOF"]
                );

                const cc_if_close_loc = util.positions(code)[1].loc;
                assert.equal(cc_if_close_loc.first_column, 41);
                assert.equal(cc_if_close_loc.last_column, 42);
            });

            it("should find the tokens for an @if statement", () => {
                assert.deepEqual(
                    util.tokens(`@if (true) WScript.Echo("Hello!"); @end`),
                    ["CC_IF_OPEN", "CC_IF_CLOSE", "CC_ENDIF", "EOF"]
                );
            });

            it("should find the tokens for an @if/@else statement", () => {
                assert.deepEqual(
                    util.tokens(`
                      @if (true)
                        WScript.Echo("Hello!");
                      @else
                        WScript.Echo("world");
                      @end`),
                    ["CC_IF_OPEN", "CC_IF_CLOSE", "CC_ELSE", "CC_ENDIF", "EOF"]
                );
            });

            it("should detect cc_on when used inside a CC comment", () => {
                assert.deepEqual(
                    util.tokens(`/*@cc_on @*/`),
                    ["CC_CMNT_CC_ON", "CC_CMNT_END", "EOF"]
                );
            });

            it("should detect beginning and ending CC comments whe CC is enabled", () => {
                const code = `@cc_on /*@if (true) Wscript.Echo("Hello!"); @end @*/`;
                assert.deepEqual(
                    util.tokens(code),
                    ["CC_ON", "CC_CMNT_IF_OPEN", "CC_IF_CLOSE", "CC_ENDIF", "CC_CMNT_END", "EOF" ]
                );
            });
        });
    });
});
