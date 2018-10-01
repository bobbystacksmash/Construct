const JisonLex = require("jison-lex"),
      beautify = require("js-beautify"),
      fs       = require("fs");

function find_and_replace (lines_of_code, token, options) {

    options = options || {};

    const predef_vars_defaults = {
        "CC_VAR_WIN32": true,
        "CC_VAR_WIN16": NaN,
        "CC_VAR_MAC": NaN,
        "CC_VAR_ALPHA": NaN,
        "CC_VAR_X86": true,
        "CC_VAR_680": NaN,
        "CC_VAR_PPC": NaN,
        "CC_VAR_JSCRIPT": true,
        "CC_VAR_JSCRIPT_BUILD": "19130",
        "CC_VAR_JSCRIPT_VERSION": "5.8"

    };

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
    case "CC_CMNT_CC_ON":
    case "CC_CMNT_END":
        middle = "";
        break;

    case "CC_CMNT_IF_OPEN":
    case "CC_IF_OPEN":
        middle = "if (";
        break;

    case "CC_ELIF_OPEN":
        middle = "} else if (";
        break;

    case "CC_IF_CLOSE":
    case "CC_ELIF_CLOSE":
        middle = ") {";
        break;

    case "CC_ELSE":
        middle = "} else {";
        break;

    case "CC_VAR_WIN32":
    case "CC_VAR_WIN16":
    case "CC_VAR_MAC":
    case "CC_VAR_ALPHA":
    case "CC_VAR_X86":
    case "CC_VAR_680":
    case "CC_VAR_PPC":
    case "CC_VAR_JSCRIPT":
    case "CC_VAR_JSCRIPT_BUILD":
    case "CC_VAR_JSCRIPT_VERSION":
        middle = predef_vars_defaults[token_name];
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

module.exports = {
    transpile: transpile
};
