const JisonLex = require("jison-lex"),
      fs       = require("fs");

var grammar = fs.readFileSync("./test.l").toString(),
    lexer   = new JisonLex(grammar);

const CODE_1 ='/*@cc_on @*/';

lexer.setInput(CODE_1);


let lexeme;
while (lexeme !== 'EOF') {
    lexeme = lexer.lex();
    console.log(lexeme);
}
