const JisonLex = require("jison-lex"),
      fs       = require("fs");

const grammar = fs.readFileSync("cc.l", "utf8"),
      lexer   = new JisonLex(grammar);

lexer.setInput("@cc_on foo");

var tok = lexer.lex();

while (true) {
    tok = lexer.lex();
    console.log("TOKEN>", tok);

    if (tok === "EOF") {
        break;
    }

    console.log(tok);
}
