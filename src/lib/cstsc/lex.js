const JisonLex = require("jison-lex"),
      fs       = require("fs");

const file_to_read = process.argv[2];

var grammar = fs.readFileSync("./test.l").toString(),
    file    = fs.readFileSync(file_to_read).toString(),
    lexer   = new JisonLex(grammar);

console.log(file_to_read);
lexer.setInput(file);

let lexeme;
while (lexeme !== 'EOF') {
    lexeme = lexer.lex();
    console.log(lexeme);
}
