const assert   = require("chai").assert,
      JisonLex = require("jison-lex"),
      fs       = require("fs");

const LEXER_SRCFILE = "src/lib/cstsc/cc.l",
      LEXER_GRAMMAR = fs.readFileSync(LEXER_SRCFILE, "utf-8");

var lexer;


const util = {
    tokens_array: function (code) {

        let thislex = new JisonLex(LEXER_GRAMMAR),
            token   = null,
            tokens  = [];

        thislex.setInput(code);

        while (token !== 'EOF') {
            token = thislex.lex();
            tokens.push(token);
        }

        return tokens;
    }
};

describe("CSTSC: Construct's Source-To-Source Compiler", () => {

    beforeEach(function () {
        lexer = new JisonLex(LEXER_GRAMMAR);
    });

    describe("Enabling Conditional Compilation (CC)", () => {

        it("should not detect CC when in a multi-line comment with a space", () => {

            assert.deepEqual(
                util.tokens_array("/* @cc_on @if(1) WScript.Echo('HELLO'); @end @*/"),
                ["MLINE_COMMENT_START", "MLINE_COMMENT_END", "EOF"]
            );
        });

        it("should enable CC when using the special CC comment syntax", () => {

            assert.deepEqual(
                util.tokens_array("/*@cc_on @*/"),
                ["CC_ON", "CC_OFF", "EOF"]
            );
        });

        it("should enable CC when no comments are used", () => {
            assert.deepEqual(
                util.tokens_array("@cc_on WScript.Echo('Hello');"),
                ["CC_ON", "EOF"]
            );
        });
    });
});
