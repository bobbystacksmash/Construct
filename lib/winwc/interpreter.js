

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

            console.log("Attempting greedy match...");
            let greedy_match_result = matcher(pstack, fstack.slice(1));
            console.log("Greedy match result:", greedy_match_result);

            if (greedy_match_result === true) {
                return matcher(pstack, fstack.slice(1));
            }


            if (greedy_match_result === false) {
                console.log("Aborting greedy match...");
                return matcher(pstack.slice(1), fstack);
            }
        }

    }

    return false;
}


wc_match_helper("foo.tx<t", "foo.txt");



module.exports = wc_match_helper;
