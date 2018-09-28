const JisonLex = require("jison-lex"),
      beautify = require("js-beautify"),
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

    let line      = lines_of_code[lineno],
        beginning = line.slice(0, loc_first_col),
        middle    = line.slice(loc_first_col, loc_last_col),
        end       = line.slice(loc_last_col);

    switch (token_name) {
    case "CC_ON":
        middle = "";
        break;

    case "CC_IF_OPEN":
        middle = "if (";
        break;

    case "CC_IF_CLOSE":
        middle = ") {";
        break;

    case "CC_ELSE":
        middle = "} else {";
        break;

    case "CC_ENDIF":
        middle = "}";
        break;
    }

    line = [beginning, middle, end].join("");
    lines_of_code[lineno] = line;

    return lines_of_code;
}


function transpile (code_in) {

    let tokens = [],
        token;

    const grammar = fs.readFileSync(require.resolve("./jscript.l")).toString(),
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

    return (lines_of_code.length === 1)
        ? lines_of_code.pop()
        : lines_of_code.join("\n");
};

//let code = transpile(`@cc_on @if (true || "@cc_on" || false) WScript.Echo("Hello!"); @else WScript.Echo("World!"); @end`);

module.exports = {
    transpile: transpile
};
