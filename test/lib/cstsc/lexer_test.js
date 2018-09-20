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
                    ["OPEN_DQUOTE_STRING", "CLOSE_DQUOTE_STRING", "EOF"]
                );
            });

            it("should detect escaped double quotes in double-quoted strings", () => {
                assert.deepEqual(
                    util.tokens_array(`"hello \\"world!\\""`),
                    ["OPEN_DQUOTE_STRING", "CLOSE_DQUOTE_STRING", "EOF"]
                );
            });

            it("should allow single quotes within double-quoted strings", () => {
                assert.deepEqual(
                    util.tokens_array(`"Hello, 'world'"`),
                    ["OPEN_DQUOTE_STRING", "CLOSE_DQUOTE_STRING", "EOF"]
                );
            });
        });

        describe("Single-quoted strings", () => {

            it("should detect single-quote strings", () => {
                assert.deepEqual(
                    util.tokens_array(`'hello world'`),
                    ["OPEN_SQUOTE_STRING", "CLOSE_SQUOTE_STRING", "EOF"]
                );
            });

            it("should detect escaped single-quotes in single-quoted strings", () => {
                assert.deepEqual(
                    util.tokens_array(`'hello \\'world\\''`),
                    ["OPEN_SQUOTE_STRING", "CLOSE_SQUOTE_STRING", "EOF"]
                );
            });
            it("should allow double quotes within single-quoted strings", () => {
                assert.deepEqual(
                    util.tokens_array(`'Hello, "world"'`),
                    ["OPEN_SQUOTE_STRING", "CLOSE_SQUOTE_STRING", "EOF"]
                );
            });
        });

    });

    xdescribe("Comment Detection", () => {

        describe("Conditional-compilation comments", () => {

            it("should detect a CC comment begin and end block", () => {
                assert.deepEqual(
                    util.tokens_array(`/*@cc_on CC comment block @*/`),
                    ["OPEN_CC_COMMENT", "CLOSE_CC_COMMENT", "EOF"]
                );
            });
        });

        describe("Single-line comments", () => {

            it("should detect a single-line comment", () => {
                assert.deepEqual(
                    util.tokens_array("// hello world"),
                    ["OPEN_SLINE_COMMENT", "EOF"]
                );
            });

            it("should continue the comment up until the end of the line", () => {
                assert.deepEqual(
                    util.tokens_array(`// hello world this is a test`),
                    ["OPEN_SLINE_COMMENT", "EOF"]
                );
            });

            it("should stop the single line comment after a newline", () => {
                assert.deepEqual(
                    util.tokens_array([`// hello world`, `/* testing */`].join("\n")),
                    [
                        "OPEN_SLINE_COMMENT",
                        "CLOSE_SLINE_COMMENT",
                        "MLINE_COMMENT_BEGIN",
                        "CLOSE_MLINE_COMMENT",
                        "EOF"
                    ]
                );
            });

            it("should ignore the contents of the single line comment", () => {
                assert.deepEqual(
                    util.tokens_array(`// "test" /* test */`),
                    ["OPEN_SLINE_COMMENT", "EOF"]
                );
            });
        });

        describe("Multi-line comments", () => {

            it("should detect a mutli line comment", () => {
                assert.deepEqual(
                    util.tokens_array(`/* hello world */`),
                    ["MLINE_COMMENT_BEGIN", "CLOSE_MLINE_COMMENT", "EOF"]
                );
            });

            it("should ignore strings and single-line comments inside an mline comment", () => {
                assert.deepEqual(
                    util.tokens_array(`/* "hello world" // testing 'foobar' */`),
                    ["MLINE_COMMENT_BEGIN", "CLOSE_MLINE_COMMENT", "EOF"]
                );
            });
        });
    });

    describe("Enabling Conditional Compilation (CC)", () => {

        it("should enable CC", () => {
            assert.deepEqual(
                util.tokens_array(`@cc_on`),
                ["CC_ON_STANDALONE", "EOF"]
            );
        });

        it("should only report the first @cc_on standalone token", () => {
            assert.deepEqual(
                util.tokens_array("@cc_on @cc_on @cc_on"),
                ["CC_ON_STANDALONE", "EOF"]
            );
        });

        it("should enable CC when in a CC comment", () => {
            assert.deepEqual(
                util.tokens_array(`/*@cc_on @*/`),
                ["OPEN_CC_COMMENT_CC_ON", "CLOSE_CC_COMMENT", "EOF"]
            );
        });

        it("should enable CC using only the @if statement", () => {

        });
    });

    describe("Variables", () => {

        describe("@set", () => {

            it("should detect the @set statement", () => {
                assert.deepEqual(
                    util.tokens_array(`@set @foo = 12;`),
                    ["OPEN_CC_SET", "CC_VAR_NAME", "EOF"]
                );
            });

            it("shouldn't enable @set when it appears within a string", () => {
                assert.deepEqual(
                    util.tokens_array(`"@set @foo = 12;"`),
                    ["OPEN_DQUOTE_STRING", "CLOSE_DQUOTE_STRING", "EOF"]
                );
            });

            it("shouldn't enable @set when it appears within a multi-line comment", () => {
                assert.deepEqual(
                    util.tokens_array(`/* @set @foo = 12; */`),
                    ["OPEN_MLINE_COMMENT", "CLOSE_MLINE_COMMENT", "EOF"]
                );
            });

            it("shouldn't enable @set when it appears within a single-line comment", () => {
                assert.deepEqual(
                    util.tokens_array(`// @set @foo = 12;`),
                    ["OPEN_SLINE_COMMENT", "EOF"]
                );
            });
        });
    });

    describe("Conditionals", () => {

        it("should not detect an @if before @cc_on has been used", () => {
            assert.deepEqual(
                util.tokens_array(`@if (true) WScript.Echo("Hello!"); @end`),
                ["OPEN_CC_IF", "CLOSE_CC_IF", "EOF"]
            );
        });
    });
});
