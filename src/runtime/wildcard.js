const path = require("path").win32;


function translate_pattern (pattern) {

    let normpat  = normalise(pattern),
        transpat = normpat
            .replace(/\.\?/g, '"?')
            .replace(/\.\*/g, '"*')
            .replace(/[?]/g, ">");

    if (/[*]$/.test(transpat) && /[.]$/.test(pattern)) {
        transpat = transpat.replace(/\*$/, "<");
    }

    transpat = transpat.replace(/<[<]+/g, "<");
    return transpat;
}

function normalise (str) {
    return path.normalize(str).replace(/[.\s]+$/g, "");
}

// is_lexed_pattern_literal
// ========================
//
// Given a pattern outputted from the lexer, figure out if the pattern
// contains only "LITERAL" elements -- useful when trying to optimise
// matches.
//
function is_lexed_pattern_literal (lexed_pattern) {
    return lexed_pattern.every(tok => tok.type === "LITERAL");
}

function lex_pattern (pattern) {

    let token_list = pattern.split("").map((ch, i, arr) => {

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


function lex_filename (filename) {

    const last_dot_pos = filename.lastIndexOf(".");

    return filename.split("").map((tok, arr, i) => {
        return { pos: i, type: "literal", value: tok, raw: tok };
    });
}

// matcher_helper
// ==============
//
// Helps set-up a match be ensuring that patterns and files are
// correctly normalised and optimised ready for matching.
//
function matcher_helper (files, pattern, options) {

    pattern = translate_pattern(pattern);

    const lpattern = lex_pattern(pattern),
          pattern_is_literal = is_lexed_pattern_literal(lpattern);

    if (pattern_is_literal) {
        return files.filter(f => f.toLowerCase() === pattern.toLowerCase());
    }

    let matches = files.filter(f => matcher(lex_filename(normalise(f)), lpattern));

    return matches;
}

// matcher
// =======
//
function matcher (filename, pattern) {

    if (filename.length === 0 && pattern.length === 0) return true;
    if (filename.length >   0 && pattern.length === 0) return false;

    const tok_filename = filename[0],
          tok_pattern  = pattern[0];

    if (tok_pattern.type === "literal") {

        if (tok_pattern.value.toLowerCase() === tok_filename.value.toLowerCase()) {
            return matcher(filename.slice(1), pattern.slice(1));
        }

        return false;
    }

    if (tok_pattern.value === "ASTERISK") {
        // TODO
    }
    else if (tok_pattern.value === "QMARK") {
        return matcher(filename.slice(1), pattern.slice(1));
    }
    else if (tok_pattern.value === "DOS_STAR") {
        return matcher(filename.slice(1), pattern);
    }
    else if (tok_pattern.value === "DOS_QM") {
        // TODO
    }
    else if (tok_pattern.value === "DOS_DOT") {
        // TODO
    }
    else {
        // UNKNOWN
        // TODO
    }
}

module.exports = { match: matcher_helper };
