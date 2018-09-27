const JisonLex = require("jison-lex"),
      fs       = require("fs");

const grammar = fs.readFileSync("jscript.l", "utf8"),
      lexer   = new JisonLex(grammar);

lexer.setInput(`"foo" @cc_on`);

// TODO in the morning:
//
//  Write the grammar/parser so we can transpile a `@if (...) [expr]
//  @end` correctly.

var tok = lexer.lex();

while (true) {
    console.log("TOKEN>", tok);

    if (tok === "EOF") {
        break;
    }
    tok = lexer.lex();
 }
