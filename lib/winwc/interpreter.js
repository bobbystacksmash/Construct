const path = require("path").win32;

const LOG = true;

function log (...args) {
    if (LOG) {
        console.log(...args);
    }
}

wc_match_helper("<<a<", "a.1");

function translate_pattern (original_pattern, normalised_pattern) {

    let transpat = normalised_pattern
            .replace(/\.\?/g, '"?')
            .replace(/\.\*/g, '"*')
            .replace(/[?]/g, ">");

    if (/[*]$/.test(transpat) && /[.]$/.test(original_pattern)) {
        transpat = transpat.replace(/\*$/, "<");
    }

    // Optimisations...
    transpat = transpat
        .replace(/<[<]+/g, "<");


    return transpat;
}

function normalise (str) {

    let norm_str = path.normalize(str);

    norm_str = norm_str
        .replace(/[.\s]+$/g, "");

    return norm_str;
}

function wc_match_helper (pattern, filename) {

    if (/^[.]{1,2}$/.test(filename)) return false;

    // The process of getting things looking sane is to:
    //
    //  1. Normalise the PATTERN.
    //  2. Translate the PATTERN.
    //  3. Normalise the FILENAME.
    //
    let tpattern = translate_pattern(pattern, normalise(pattern)),
        nfilename = normalise(filename);

    log("ORIGPAT", pattern, "TRANSPAT:", tpattern);

    let pstack = lexer(tpattern),
        fstack = nfilename.split("");

    log("PAT", tpattern, "FILE", nfilename);

    let match_result = matcher(pstack, fstack);

    log(pattern, "matches", filename, match_result);

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
            token.value = "DOS_DOT";
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

    //if (pstack.length === 1 && (pstack[0].value === "DOS_STAR" || pstack[0].value === "ASTERISK")) {
    if (pstack.length === 1 && pstack[0].value === "ASTERISK") {
        return true;
    }

    log("--fstack--");
    log(fstack);
    log(pstack.map(t => t.raw).join(""));
    log("");


    if (pstack.length === 0 && fstack.length === 0) {
        return true;
    }
    else if (fstack.length > 0 && pstack.length === 0) {
        return false;
    }

    let pat = pstack[0],
        chr = fstack[0];

    if (pat.type === "literal") {

        if (chr === undefined) {
            return false;
        }

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

            if (greedy_match_result) {
                return true;
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
        else if (pat.value === "DOS_DOT") {
            // Matches either a literal '.', or nothing if at the end
            // of the string.
            if (chr === undefined) {
                // No more filename patterns are left.
                return true;
            }

            if (chr === ".") {
                return matcher(pstack.slice(1), fstack.slice(1));
            }
        }
        else if (pat.value === "ASTERISK") {
            // A greedy metachar which can match anywhere, zero or
            // more times.

            if (chr === undefined) {
                return true;
            }

            let greedy_match_result = matcher(pstack, fstack.slice(1));

            if (greedy_match_result) {
                return true;
            }
            else {
                return matcher(pstack.slice(1), fstack);
            }
        }
    }


    return false;
}


// PATTERN(abc.<)
// SUCCESSFUL MATCHES [ 'abc.123', 'abc.123.xyz', 'abc.123.xyz.789' ]
// EXPECTED MATCHES   [ 'abc.123' ]

// This should not match.



module.exports = wc_match_helper;
