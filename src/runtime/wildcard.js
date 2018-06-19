const path = require("path").win32;

function translate_pattern (pattern, options) {

    options = options || {};
    options = Object.assign({ skip_qmark: false }, options);

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

function is_filename_shortname (filename) {

    if (filename.length <= 8) {
        return true;
    }

    if ((filename.match(/\./g) || []).length > 1) {
        // Shortnames may only have a single dot in their name --
        // any more than that and this isn't a shortname.
        return false;
    }

    if (filename.includes(".")) {

        let name_and_ext_parts = filename.split("."),
            namepart           = name_and_ext_parts[0],
            extpart            = name_and_ext_parts[1];

        if (namepart.length > 0 && namepart.length <= 8) {
            if (extpart.length <= 3) { // Extensions are optional.
                // .TODO1
                // Need to finish the shortname checks...
                // .TODO2
                return true;
            }
        }
    }

    return false;
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
    const is_shortname = is_filename_shortname(filename);

    return filename.split("").map((tok, i) => {

        return { pos: i, type: "literal", value: tok, raw: tok, sfn: is_shortname };
    });
}

// matcher_helper
// ==============
//
// Helps set-up a match be ensuring that patterns and files are
// correctly normalised and optimised ready for matching.
//
function matcher_helper (files, pattern, options) {

    options = options || { skip_qmark: false };

    pattern = translate_pattern(pattern);

    const lpattern = lex_pattern(pattern),
          pattern_is_literal = is_lexed_pattern_literal(lpattern);

    if (pattern_is_literal) {
        return files.filter(f => f.toLowerCase() === pattern.toLowerCase());
    }

    let matches = files.filter(f => matcher(lex_filename(normalise(f)), lpattern));

    return matches;
}

// lookahead
// =========
//
// Looks ahead one element in the `tokens' array.  If the array
// contains fewer than two element, returns FALSE, else it returns the
// element in pos[1].
//
function lookahead (tokens) {

    if (tokens.length < 2) return false;
    return tokens[1];
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

        if (tok_filename && tok_pattern.value.toLowerCase() === tok_filename.value.toLowerCase()) {
            return matcher(filename.slice(1), pattern.slice(1));
        }

        return false;
    }


    // ASTERISK: *
    // QMARK:    ?
    // DOS_STAR: <
    // DOS_QM:   >
    // DOS_DOR:  "

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

        // Matches zero if:
        //
        //  - appears to the left of a period
        //  - appears at the end of the string
        //  - appears contiguous to other DOS_QM that are in either of the above positions.
        //
        if (tok_filename === undefined) {
            return matcher(filename, pattern.slice(1));
        }
        else if (tok_filename.value === ".") {
            return matcher(filename, pattern.slice(1));
        }

        // Match any single character.
        return matcher(filename.slice(1), pattern.slice(1));
    }
    else if (tok_pattern.value === "DOS_DOT") {
        //
        // Matches a period or zero characters at the end of the
        // string.
        //
        if (filename.length === 0) return true;

        if (tok_filename.value === ".") {
            return matcher(filename.slice(1), pattern.slice(1));
        }
    }

    return false;
}

module.exports = {
    match       : matcher_helper,
    is_shortname: is_filename_shortname
};
