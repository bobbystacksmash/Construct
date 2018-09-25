const assert   = require("chai").assert,
      JisonLex = require("jison-lex"),
      fs       = require("fs");

const /*LEXER_SRCFILE = "src/lib/cstsc/cc.l",*/
      LEXER_SRCFILE = "src/lib/cstsc/jscript.l",
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

    xdescribe("String detection", () => {

        describe("Double-quoted strings", () => {

            it("should detect double-quote strings", () => {
                assert.deepEqual(
                    util.tokens_array(`"hello world"`),
                    ["DoubleQuotedStringBegin", "DoubleQuotedStringEnd", "EOF"]
                );
            });

            it("should detect escaped double quotes in double-quoted strings", () => {
                assert.deepEqual(
                    util.tokens_array(`"hello \\"world!\\""`),
                    ["DoubleQuotedStringBegin", "DoubleQuotedStringEnd", "EOF"]
                );
            });

            it("should allow single quotes within double-quoted strings", () => {
                assert.deepEqual(
                    util.tokens_array(`"Hello, 'world'"`),
                    ["DoubleQuotedStringBegin", "DoubleQuotedStringEnd", "EOF"]
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

    describe("Comment Detection", () => {

        describe("Conditional-compilation comments", () => {

            it("should detect a CC comment begin and end block", () => {
                assert.deepEqual(
                    util.tokens_array(`/*@cc_on CC comment block @*/`),
                    ["OPEN_CC_COMMENT_CC_ON", "CLOSE_CC_COMMENT", "EOF"]
                );
            });
        });

        describe("Single-line comments", () => {

            it("should detect a single-line comment", () => {
                assert.deepEqual(
                    util.tokens_array("// hello world"),
                    ["SingleLineCommentBegin", "EOF"]
                );
            });

            it("should continue the comment up until the end of the line", () => {
                assert.deepEqual(
                    util.tokens_array(`// hello world this is a test`),
                    ["SingleLineCommentBegin", "EOF"]
                );
            });

            it("should stop the single line comment after a newline", () => {
                assert.deepEqual(
                    util.tokens_array([`// hello world`, `/* testing */`].join("\n")),
                    [
                        "SingleLineCommentBegin",
                        "SingleLineCommentEnd",
                        "MultiLineCommentBegin",
                        "MultiLineCommentEnd",
                        "EOF"
                    ]
                );
            });

            it("should ignore the contents of the single line comment", () => {
                assert.deepEqual(
                    util.tokens_array(`// "test" /* test */`),
                    ["SingleLineCommentBegin", "EOF"]
                );
            });
        });

        describe("Multi-line comments", () => {

            it("should ignore all tokens found within the multi-line comment", () => {
                assert.deepEqual(
                    util.tokens_array(`/* "hello world" */`),
                    ["MultiLineCommentBegin", "MultiLineCommentEnd", "EOF"]
                );
            });

            it("should detect a mutli line comment", () => {
                assert.deepEqual(
                    util.tokens_array(`/* hello world */`),
                    ["MultiLineCommentBegin", "MultiLineCommentEnd", "EOF"]
                );
            });

            it("should ignore strings and single-line comments inside an mline comment", () => {
                assert.deepEqual(
                    util.tokens_array(`/* "hello world" // testing 'foobar' */`),
                    ["MultiLineCommentBegin", "MultiLineCommentEnd", "EOF"]
                );
            });
        });
    });

    xdescribe("Enabling Conditional Compilation (CC)", () => {

        it("should enable CC", () => {
            assert.deepEqual(
                util.tokens_array(`@cc_on`),
                ["CC_ON_LITERAL", "EOF"]
            );
        });

        it("should enable CC when in a comment", () => {
            assert.deepEqual(
                util.tokens_array(`/*@cc_on @*/`),
                ["OPEN_CC_COMMENT_CC_ON", "CLOSE_CC_COMMENT", "EOF"]
            );
        });

        it("should only report the first @cc_on standalone token", () => {
            assert.deepEqual(
                util.tokens_array("@cc_on @cc_on @cc_on"),
                ["CC_ON_LITERAL", "EOF"]
            );
        });

        it("should enable CC when using a literal CC @if", () => {
            const code = `@if (true) WScript.Echo("Hello"); @end`;
            assert.deepEqual(
                util.tokens_array(code),
                [
                    "CCIfStatementBegin",
                    "CCIfStatementEnd",
                    "DoubleQuotedStringBegin",
                    "DoubleQuotedStringEnd",
                    "CCEndIf",
                    "EOF"
                ]
            );
        });

        it("should enable CC when using a literal @cc_on and @if", () => {
            assert.deepEqual(
                util.tokens_array(`@cc_on @if (true) WScript.Echo("Hello"); @end`),
                [
                    "CC_ON_LITERAL",
                    "CCIfStatementBegin",
                    "CCIfStatementEnd",
                    "DoubleQuotedStringBegin",
                    "DoubleQuotedStringEnd",
                    "EOF"
                ]
            );
        });

        it("should not notice the /*@if when no preceding @cc_on is detected", () => {
            assert.deepEqual(
                util.tokens_array(`/*@if (true) WScript.Echo("Hello"); @end @*/`),
                ["OPEN_MLINE_COMMENT", "MultiLineCommentEnd", "EOF"]
            );
        });

        xit("should not notice a /*@set when no preceding @cc_on is detected", () => {
            assert.deepEqual(
                util.tokens_array(`/*@set @foo = 12; @*/`),
                ["OPEN_MLINE_COMMENT", "MultiLineCommentEnd", "EOF"]
            );
        });

        xit("should notice /*@if when a preceding literal @cc_on was detected", () => {
            assert.deepEqual(
                util.tokens_array(`@cc_on /*@if (true) WScript.Echo("Hello") @end @*/`),
                [
                    "CC_ON_LITERAL",
                    "OPEN_COMMENT_CC_IF",
                    "CLOSE_CC_IF",
                    "CLOSE_CC_COMMENT",
                    "EOF"
                ]
            );
        });
    });

    xdescribe("Variables", () => {

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
                    ["DoubleQuotedStringBegin", "DoubleQuotedStringEnd", "EOF"]
                );
            });

            it("shouldn't enable @set when it appears within a multi-line comment", () => {
                assert.deepEqual(
                    util.tokens_array(`/* @set @foo = 12; */`),
                    ["OPEN_MLINE_COMMENT", "MultiLineCommentEnd", "EOF"]
                );
            });

            it("shouldn't enable @set when it appears within a single-line comment", () => {
                assert.deepEqual(
                    util.tokens_array(`// @set @foo = 12;`),
                    ["SingleLineCommentBegin", "EOF"]
                );
            });
        });

        describe("Predefined variables", () => {

            const predef_vars = {
                "@_win32":           "CC_PREDEF_VAR_WIN32",
                "@_win16":           "CC_PREDEF_VAR_WIN16",
                "@_mac":             "CC_PREDEF_VAR_MAC",
                "@_alpha":           "CC_PREDEF_VAR_ALPHA",
                "@_x86":             "CC_PREDEF_VAR_X86",
                "@_mc68x0":          "CC_PREDEF_VAR_MC68X0",
                "@_PowerPC":         "CC_PREDEF_VAR_POWERPC",
                "@_jscript":         "CC_PREDEF_VAR_JSCRIPT",
                "@_jscript_build":   "CC_PREDEF_VAR_JSCRIPT_BUILD",
                "@_jscript_version": "CC_PREDEF_VAR_JSCRIPT_VERSION"
            };

            it("should correctly detect literal predefined variables when CC is on", () => {
                Object.keys(predef_vars).forEach(v => {
                    assert.deepEqual(
                        util.tokens_array(`@cc_on ${v}`),
                        ["CC_ON_LITERAL", predef_vars[v], "EOF"]
                    );
                });
            });

            it("should ignore CC literals when CC is not enabled", () => {
                Object.keys(predef_vars).forEach(v => {
                    assert.deepEqual(
                        util.tokens_array(`${v}`),
                        ["EOF"]
                    );
                });
            });

            it("should detect CC vars inside a CC comment when CC is enabled", () => {
                Object.keys(predef_vars).forEach(v => {
                    assert.deepEqual(
                        util.tokens_array(`@cc_on /*@ WScript.Echo(${v}) @*/`),
                        ["CC_ON_LITERAL", predef_vars[v], "EOF"]
                    );
                });
            });

            it("should not detect CC vars inside a CC comment when CC is not enabled", () => {
                Object.keys(predef_vars).forEach(v => {
                    assert.deepEqual(
                        util.tokens_array(`/*@ WScript.Echo(${v}) @*/`),
                        ["OPEN_MLINE_COMMENT", "MultiLineCommentEnd", "EOF"]
                    );
                });
            });

            it("should detect CC vars inside a CC-on comment", () => {
                Object.keys(predef_vars).forEach(v => {
                    assert.deepEqual(
                        util.tokens_array(`/*@cc_on WScript.Echo(${v}) @*/`),
                        ["OPEN_CC_COMMENT_CC_ON", predef_vars[v], "CLOSE_CC_COMMENT", "EOF"]
                    );
                });
            });
        });
    });

    xdescribe("Conditionals", () => {

        it("should detect @if, @else, and @end", () => {
            assert.deepEqual(
                util.tokens_array(`@if (true)
                                     WScript.Echo("Hello!");
                                   @end`),
                [
                    "CCIfStatementBegin",
                    "CCIfStatementEnd",
                    "DoubleQuotedStringBegin",
                    "DoubleQuotedStringEnd",
                    "CCEndIf",
                    "EOF"
                ]
            );

            assert.deepEqual(
                util.tokens_array(`@if (true)
                                     WScript.Echo("Hello!");
                                   @else
                                     WScript.Echo("World!");
                                   @end`),
                [
                    "CCIfStatementBegin",
                    "CCIfStatementEnd",
                    "DoubleQuotedStringBegin",
                    "DoubleQuotedStringEnd",
                    "CCElse",
                    "DoubleQuotedStringBegin",
                    "DoubleQuotedStringEnd",
                    "CCEndIf",
                    "EOF"
                ]
            );
        });

        it("should detect the parts of a simple if statement", () => {
            assert.deepEqual(
                util.tokens_array(`@if (true) WScript.Echo("Hello!"); @end`),
                ["CCIfStatementBegin", "CCIfStatementEnd", "DoubleQuotedStringBegin", "DoubleQuotedStringEnd", "CCEndIf", "EOF"]
            );
        });

        it("should handle an @if with multiple groups", () => {
            assert.deepEqual(
                util.tokens_array(`@if ((true) && (false)) WScript.Echo("Hello!"); @end`),
                ["CCIfStatementBegin", "CCIfStatementEnd", "DoubleQuotedStringBegin", "DoubleQuotedStringEnd", "CCEndIf", "EOF"]
            );
        });

        it("should ignore comments in the test part of the @if", () => {
            assert.deepEqual(
                util.tokens_array(`@if (/* foo */ true /* bar */) WScript.Echo("Hello!"); @end`),
                ["CCIfStatementBegin", "CCIfStatementEnd", "DoubleQuotedStringBegin", "DoubleQuotedStringEnd", "CCEndIf", "EOF"]
            );
        });
    });
});


// TODO:
//   if(test) / if  (test) are valid, if /*foo*/(...) is not.


/*describe("XX", () => {
    beforeEach(function () {
        lexer = new JisonLex(LEXER_GRAMMAR);
    });

    describe("CC Literals", () => {
        describe("@if", () => {
            it("should ", () => {
                assert.deepEqual(
                    util.tokens_array(`@if (true) WScript.Echo("Hello!"); @end`),
                    [
                        "CCIfStatementBegin",
                        "CCIfStatementEnd",
                        "CCEndIf",
                        "EOF"
                    ]
                );
            });
        });
    });

    xdescribe("Comments", () => {
        it("should identify multi-line comments", () => {
            assert.deepEqual(
                util.tokens_array(`/* foobar /`),
                ["MultiLineCommentBegin", "MultiLineCommentEnd", "EOF"]
            );
        });
    });
 });*/
