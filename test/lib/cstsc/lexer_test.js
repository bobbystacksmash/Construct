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
                    ["CC_ON", "CC_CMNT_OPEN", "CC_CMNT_END", "EOF"]
                );
            });

            it("should detect a /*@cc_on comment", () => {
                assert.deepEqual(
                    util.tokens(`/*@cc_on @*/`),
                    ["CC_CMNT_CC_ON", "CC_CMNT_END", "EOF"]
                );
            });

            it("should correctly detect an @if inside a CC comment", () => {
                const code = `/*@cc_on @if (true) WScript.Echo("Hello!"); @end @*/`;
                assert.deepEqual(
                    util.tokens(code),
                    ["CC_CMNT_CC_ON", "CC_IF_OPEN", "CC_IF_CLOSE", "CC_ENDIF", "CC_CMNT_END", "EOF"]
                );
            });

            it("should correctly match when mixed with standard multi-line comments", () => {
                const code = `/*@cc_on /* A */ @*//* B */`;
                assert.deepEqual(
                    util.tokens(code),
                    ["CC_CMNT_CC_ON", "CC_CMNT_END", "EOF"]
                );
            });

            it("should correctly identify CC comments", () => {
                assert.deepEqual(
                    util.tokens(`@cc_on /*@ @_win64 @*//* G */ @_jscript`),
                    [
                        "CC_ON",
                        "CC_CMNT_OPEN",
                        "CC_VAR_WIN64",
                        "CC_CMNT_END",
                        "CC_VAR_JSCRIPT",
                        "EOF"
                    ]
                );
            });
        });

        describe("Branching with @if, @elif, @else, and @end", () => {

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

            it("should handle an @if, @elif, and @end tokens", () => {
                assert.deepEqual(
                    util.tokens(`@if (true) Wscript.Echo("Hi!"); @elif (true) WScript.Echo("WRLD!"); @end`),
                    ["CC_IF_OPEN", "CC_IF_CLOSE", "CC_ELIF_OPEN", "CC_ELIF_CLOSE", "CC_ENDIF", "EOF"]
                );
            });

            it("should correctly handle comments just after the @if-test group", () => {
                assert.deepEqual(
                    util.tokens(`@if (@_win32 || @_win64)/* B  */`),
                    ["CC_IF_OPEN", "CC_VAR_WIN32", "CC_VAR_WIN64", "CC_IF_CLOSE", "EOF"]
                );
            });

            it("should detect a closing CC comment when mixed with multi-line comments", () => {
                const code = `/*@cc_on /* A */ @if (true)/* B */x = true; @*//* G */`;
                assert.deepEqual(
                    util.tokens(code),
                    ["CC_CMNT_CC_ON", "CC_IF_OPEN", "CC_IF_CLOSE", "CC_CMNT_END", "EOF"]
                );
            });
        });
    });

    describe("CC Variables", () => {
        describe("Predefined", () => {

            let vars = {
                "@_win32"           : "CC_VAR_WIN32",
                "@_win16"           : "CC_VAR_WIN16",
                "@_mac"             : "CC_VAR_MAC",
                "@_alpha"           : "CC_VAR_ALPHA",
                "@_x86"             : "CC_VAR_X86",
                "@_mc680x0"         : "CC_VAR_680",
                "@_PowerPC"         : "CC_VAR_PPC",
                "@_jscript"         : "CC_VAR_JSCRIPT",
                "@_jscript_build"   : "CC_VAR_JSCRIPT_BUILD",
                "@_jscript_version" : "CC_VAR_JSCRIPT_VERSION"
            };

            it("should detect all predefined variables", () => {

                // @if ({VAR})...
                Object.keys(vars).forEach(v => assert.deepEqual(
                    util.tokens(`@if (${v}) WScript.Echo("Hi!"); @end`),
                    ["CC_IF_OPEN", vars[v], "CC_IF_CLOSE", "CC_ENDIF", "EOF"]
                ));

                // @elif ({VAR})...
                Object.keys(vars).forEach(v => assert.deepEqual(
                    util.tokens(`@if (true) WScript.Echo("Hi!"); @elif (${v}) WScript.Echo("WRLD!"); @end`),
                    ["CC_IF_OPEN", "CC_IF_CLOSE", "CC_ELIF_OPEN", vars[v], "CC_ELIF_CLOSE", "CC_ENDIF", "EOF"]
                ));

                // literals
                Object.keys(vars).forEach(v => assert.deepEqual(
                    util.tokens(`${v}`), [vars[v], "EOF"]
                ));
            });

            it("should ignore all predefined variables in comments", () => {
                Object.keys(vars).forEach(v => assert.deepEqual(
                    util.tokens(`/* ${v} */`), ["EOF"]
                ));

                Object.keys(vars).forEach(v => assert.deepEqual(
                    util.tokens(`// ${v}`), ["EOF"]
                ));
            });

            it("should ignore all predefined variables in strings", () => {
                Object.keys(vars).forEach(v => assert.deepEqual(
                    util.tokens(`"${v}"`), ["EOF"]
                ));

                Object.keys(vars).forEach(v => assert.deepEqual(
                    util.tokens(`'${v}'`), ["EOF"]
                ));
            });
        });

        describe("User Defined (@set)", () => {

            it("should detect setting a user defined variable", () => {
                assert.deepEqual(
                    util.tokens(`@cc_on @set @foo = "Hi!"`),
                    ["CC_ON", "CC_SET", "CC_VAR_USERDEF", "EOF"]
                );

                // Extra spaces
                assert.deepEqual(
                    util.tokens(`@cc_on @set     @foo      = "Hi!"`),
                    ["CC_ON", "CC_SET", "CC_VAR_USERDEF", "EOF"]
                );
            });

            it("should detect user defined vars which begin with an underscore", () => {
                assert.deepEqual(
                    util.tokens(`@cc_on @set @_foo = "Hi!"`),
                    ["CC_ON", "CC_SET", "CC_VAR_USERDEF", "EOF"]
                );
            });

            it("should NOT detect user defined vars which begin with a number", () => {
                assert.deepEqual(
                    util.tokens(`@cc_on @set @12_foo = "Hi!"`),
                    ["CC_ON", "CC_SET", "EOF"]
                );
            });

            //
            // Once defined, check that the variable is detected in
            // different contexts.
            //
            it("should detect a userdef var inside an @if-test", () => {
                assert.deepEqual(
                    util.tokens(`@set @foo = "Hi!"; @if (@foo) WScript.Echo("World"); @end`),
                    [
                        "CC_SET",
                        "CC_VAR_USERDEF",
                        "CC_IF_OPEN",
                        "CC_VAR_USERDEF_REF",
                        "CC_IF_CLOSE",
                        "CC_ENDIF",
                        "EOF"
                    ]
                );
            });

            it("should detect a userdef var inside an @elif-test", () => {
                const code = `@set @foo = "Hi!"; @if (false) A++; @elif (@foo) B++; @end`;
                assert.deepEqual(
                    util.tokens(code),
                    [
                        "CC_SET",
                        "CC_VAR_USERDEF",
                        "CC_IF_OPEN",
                        "CC_IF_CLOSE",
                        "CC_ELIF_OPEN",
                        "CC_VAR_USERDEF_REF",
                        "CC_ELIF_CLOSE",
                        "CC_ENDIF",
                        "EOF"
                    ]
                );
            });

            it("should detect a userdef var inside /*@ .. @*/", () => {
                assert.deepEqual(
                    util.tokens(`@set @foo = "Hi!"; /*@ WScript.Echo(@foo); @*/`),
                    [
                        "CC_SET",
                        "CC_VAR_USERDEF",
                        "CC_CMNT_OPEN",
                        "CC_VAR_USERDEF_REF",
                        "CC_CMNT_END",
                        "EOF"
                    ]
                );
            });

            it("should NOT detect a userdef var inside strings", () => {
                assert.deepEqual(
                    util.tokens(`@set @foo = "Hi!"; var x = "@foo";`),
                    ["CC_SET", "CC_VAR_USERDEF", "EOF"]
                );

                assert.deepEqual(
                    util.tokens(`@set @foo = "Hi!"; var x = '@foo';`),
                    ["CC_SET", "CC_VAR_USERDEF", "EOF"]
                );
            });

            it("should NOT detect a userdef var inside comments", () => {
                assert.deepEqual(
                    util.tokens(`@set @foo = "Hi!"; // @foo`),
                    ["CC_SET", "CC_VAR_USERDEF", "EOF"]
                );

                assert.deepEqual(
                    util.tokens(`@set @foo = "Hi!"; /* @foo */`),
                    ["CC_SET", "CC_VAR_USERDEF", "EOF"]
                );
            });
        });
    });
});
