const JisonLex = require("jison-lex"),
      fs       = require("fs");

function find_and_replace (lines_of_code, token) {

    switch (token.name) {
    case "OPEN_DQUOTE_STRING":
    case "CLOSE_DQUOTE_STRING":
        return lines_of_code;
    }

    const token_name    = token.name,
          loc_first_col = token.loc.first_column,
          loc_last_col  = token.loc.last_column,
          lineno        = token.line;


    console.log("[ find / replace ]");


    let line      = lines_of_code[lineno],
        beginning = line.slice(0, loc_first_col),
        middle    = line.slice(loc_first_col, loc_last_col),
        end       = line.slice(loc_last_col);

    console.log("TOKEN -->", token_name);

    switch (token_name) {
    case "CC_ON_LITERAL":
        middle = "";
        break;

    case "BEGIN_CC_IF":
        middle = "if";
        break;

    case "CLOSE_CC_IF":
        middle = "}";
        break;
    }
    console.log("BEFORE >", line);
    console.log("AFTER  >", [beginning, middle, end].join(""));
    console.log("----");

    line = [beginning, middle, end].join("");
    lines_of_code[lineno] = line;

    return lines_of_code;
}


function transpile (code_in) {

    let tokens = [],
        token;

    const grammar = fs.readFileSync("./cc.l").toString(),
          lexer   = new JisonLex(grammar);

    lexer.setInput(code_in);

    while (true) {
        token = lexer.lex();

        if (token === "EOF") {
            break;
        }

        tokens.unshift(token);
    }

    let lines_of_code = code_in.split(/\n/);

    tokens.forEach(token => {
        find_and_replace(lines_of_code, token);
    });
};

transpile(`@cc_on @if (true) WScript.Echo("Hello!"); @end`);
