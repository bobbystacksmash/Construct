

var PSTACK  = [],
    FSTACK = [];

function lexer (pattern) {

    let token_list = pattern.split("").map((ch, i) => {

        let token = { pos: i, type: "symbol", raw: ch };

        switch (ch) {
        case "*":
            token.value = "ASTERISK";
            break;
        case "?":
            token.value = "QMARK";
            break;
        case "<":
            token.value = "DOS_STAR";
            break;
        case ">":
            token.value = "DOS_QM";
            break;
        case '"':
            token.value = "DOT_DOT";
            break;
        default:
            token.type  = "literal";
            token.value = ch;
        }

        return token;
    });

    return token_list;
}


"foo.txt".split("").forEach(ch => FSTACK.push(ch));
let pattern = "f<.xt"
PSTACK = lexer(pattern);

function matcher (pstack, fstack) {

    if (pstack.length === 0 && fstack.length === 0) {
        return true;
    }

    //console.log("--pstack--");
    //console.log(pstack);
    console.log("--fstack--");
    console.log(fstack);
    console.log(pstack.map(t => t.raw).join(""));

    let pat = pstack[0],
        chr = fstack[0];

    if (pat.type === "literal") {
        if (pat.value.toLowerCase() === chr.toLowerCase()) {
            return matcher(pstack.slice(1), fstack.slice(1));
        }
    }
    else {

        switch (pat.value) {
        case "DOS_STAR":
            if (chr !== ".") {
                return matcher(pstack, fstack.slice(1));
            }
            else {
                return matcher(pstack.slice(1), fstack);
            }
        }
    }

    return false;
}


console.log("MATCHER VAL:", matcher(PSTACK, FSTACK));




















































/*function lexer (wildcard_expr) {

    let token_list = wildcard_expr.split("").map((ch, i) => {

        let token = {
            pos: i,
            type: "symbol"
        };

        switch (ch) {
        case "*":
            token.value = "ASTERISK";
            break;
        case "?":
            token.value = "QMARK";
            break;
        case "<":
            token.value = "DOS_STAR";
            break;
        case ">":
            token.value = "DOS_QM";
            break;
        case '"':
            token.value = "DOT_DOT";
            break;
        default:
            token.type  = "literal";
            token.value = ch;
        }

        return token;
    });

    token_list.push({ pos: -1, type: "symbol", value: "EOF" });
    return token_list;
}

function make_filename_stack (filename) {

    // TODO: we may want to mark-up special symbols, such as the '.'
    // to help the matcher.

    return filename.split("").map((ch, i) => {
        return { literal: ch, pos: i };
    });
}*/


/*function interpreter (wildcard_expr, filename) {

    const tokens = lexer(wildcard_expr),
          fstack = make_filename_stack(filename);

    let token_pos = 0,
        fname_pos = 0;

    let curr_fname_literal = fstack[token_pos],
        curr_token         = tokens[fname_pos];

    while (curr_token.value !== "EOF") {

        if (curr_token.type === "symbol") {

            switch (curr_token.value) {
            case "ASTERISK":
                console.log("RUN ASTERISK CODE");
                break;
            case "QMARK":
                console.log("RUN QMARK");
                opcode_QMARK(
                break;
            case "DOS_STAR":
                console.log("RUN DOS_STAR");
                break;
            case "DOS_QM":
                console.log("RUN DOS_QM");
                break;
            case "DOS_DOT":
                console.log("RUN DOS_DOT");
                break;
            default:
                console.log("ERROR: Unknown symbol:", curr_token.value);
                break;
            }
        }

        curr_token = tokens[++token_pos];
    }
}


function opcode_QMARK (tokens, fstack,



interpreter("?", "f");
*/
