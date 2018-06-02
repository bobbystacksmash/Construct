

function wc_match_helper (pattern, filename) {
    let pstack = lexer(pattern),
        fstack = filename.split("");

    if (pattern === "<") return true;

    let match_result = matcher(pstack, fstack);

    console.log("MATCHED:", match_result);

    return match_result;
};

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


function matcher (pstack, fstack) {

    if (pstack.length === 0 && fstack.length === 0) {
        return true;
    }

    console.log("--fstack--");
    console.log(fstack);
    console.log(pstack.map(t => t.raw).join(""));
    console.log("");

    if (pstack.length === 0 && fstack.length === 0) {
        return true;
    }
    else if (fstack.length > 0 && pstack.length === 0) {
        return false;
    }

    let pat = pstack[0],
        chr = fstack[0];

    if (pat.type === "literal") {
        if (pat.value.toLowerCase() === chr.toLowerCase()) {
            return matcher(pstack.slice(1), fstack.slice(1));
        }
    }
    else {

        if (pat.value === "DOS_STAR") {

            if (chr === undefined) {
                return true;
            }

            if (chr === ".") {
                return matcher(pstack.slice(1), fstack);
            }

            let greedy_match_result = matcher(pstack, fstack.slice(1));

            if (greedy_match_result === true) {
                return matcher(pstack, fstack.slice(1));
            }
            else {
                return matcher(pstack.slice(1), fstack);
            }
        }
        else if (pat.value === "DOS_QM") {
            // Never matches a DOT.
            if (chr === ".") {
                // Multiple DOS_QMs can match up-to a dot...
                return matcher(pstack.slice(1), fstack);
            }
            return matcher(pstack.slice(1), fstack.slice(1));
        }
    }

    return false;
}


wc_match_helper(">.<", "a.c");



module.exports = wc_match_helper;
