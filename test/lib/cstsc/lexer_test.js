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

    xdescribe("String detection", () => {

        describe("Double-quoted strings", () => {

            it("should detect double-quote strings", () => {
                assert.deepEqual(
                    util.tokens_array(`"hello world"`),
                    ["DQUOTE_STRING_BEGIN", "DQUOTE_STRING_END", "EOF"]
                );
            });

            it("should detect escaped double quotes in double-quoted strings", () => {
                assert.deepEqual(
                    util.tokens_array(`"hello \\"world!\\""`),
                    ["DQUOTE_STRING_BEGIN", "DQUOTE_STRING_END", "EOF"]
                );
            });

            it("should allow single quotes within double-quoted strings", () => {
                assert.deepEqual(
                    util.tokens_array(`"Hello, 'world'"`),
                    ["DQUOTE_STRING_BEGIN", "DQUOTE_STRING_END", "EOF"]
                );
            });
        });

        describe("Single-quoted strings", () => {

            it("should detect single-quote strings", () => {
                assert.deepEqual(
                    util.tokens_array(`'hello world'`),
                    ["SQUOTE_STRING_BEGIN", "SQUOTE_STRING_END", "EOF"]
                );
            });

            it("should detect escaped single-quotes in single-quoted strings", () => {
                assert.deepEqual(
                    util.tokens_array(`'hello \\'world\\''`),
                    ["SQUOTE_STRING_BEGIN", "SQUOTE_STRING_END", "EOF"]
                );
            });
            it("should allow double quotes within single-quoted strings", () => {
                assert.deepEqual(
                    util.tokens_array(`'Hello, "world"'`),
                    ["SQUOTE_STRING_BEGIN", "SQUOTE_STRING_END", "EOF"]
                );
            });
        });

    });

    describe("Comment Detection", () => {

        describe("Single-line comments", () => {

            it("should detect a single-line comment", () => {
                assert.deepEqual(
                    util.tokens_array("// hello world"),
                    ["SLINE_COMMENT_BEGIN", "EOF"]
                );
            });

            it("should continue the comment up until the end of the line", () => {
                assert.deepEqual(
                    util.tokens_array(`// hello world this is a test`),
                    ["SLINE_COMMENT_BEGIN", "EOF"]
                );
            });

            it("should stop the single line comment after a newline", () => {
                assert.deepEqual(
                    util.tokens_array([`// hello world`, `/* testing */`].join("\n")),
                    ["SLINE_COMMENT_BEGIN", "SLINE_COMMENT_END", "MLINE_COMMENT_BEGIN", "MLINE_COMMENT_END", "EOF"]
                );
            });

            it("should ignore the contents of the single line comment", () => {
                assert.deepEqual(
                    util.tokens_array(`// "test" /* test */`),
                    ["SLINE_COMMENT_BEGIN", "EOF"]
                );
            });
        });

        describe("Multi-line comments", () => {

            it("should detect a mutli line comment", () => {
                assert.deepEqual(
                    util.tokens_array(`/* hello world */`),
                    ["MLINE_COMMENT_BEGIN", "MLINE_COMMENT_END", "EOF"]
                );
            });

            it("should ignore strings and single-line comments inside an mline comment", () => {
                assert.deepEqual(
                    util.tokens_array(`/* "hello world" // testing 'foobar' */`),
                    ["MLINE_COMMENT_BEGIN", "MLINE_COMMENT_END", "EOF"]
                );
            });
        });
    });

    xdescribe("Enabling Conditional Compilation (CC)", () => {

        xit("should not detect CC when in a multi-line comment with a space", () => {

            assert.deepEqual(
                util.tokens_array("/* @cc_on @if(1) WScript.Echo('HELLO'); @end @*/"),
                ["MLINE_COMMENT_BEGIN", "MLINE_COMMENT_END", "EOF"]
            );
        });

        xit("should enable CC when using the special CC comment syntax", () => {

            assert.deepEqual(
                util.tokens_array("/*@cc_on @*/"),
                ["CC_ON", "CC_OFF", "EOF"]
            );
        });

        xit("should enable CC when no comments are used", () => {
            assert.deepEqual(
                util.tokens_array("@cc_on WScript.Echo('Hello');"),
                ["CC_ON", "EOF"]
            );
        });
    });

    xdescribe("Conditionals", () => {

        it("should detect an @if statement when inside a @cc_on block", () => {

            const code = `
            /*@cc_on
            WScript.Write("CC enabled");
              /*@if (@_jscript_version >= 5)
                WScript.Echo("JScript version >= 5.");
              @else @*/
                WScript.Echo("No JScript");
              /*@end
            @*/`;

            assert.deepEqual(
                util.tokens_array(code),
                ["abc"]
            );
        });
    });
});
