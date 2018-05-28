const fs    = require("fs"),
      winwc = require("./winwc"),
      deepEqual = require("deep-equal");

var results_filename = "./match_results.txt";

if (process.argv.length === 3) {
    results_filename = process.argv[2];
}

let results = fs.readFileSync(results_filename).toString();

//
// The results format is very simple.  A fragment of the file looks
// something like:
//
//   TEST FILES:.leading_dot|a|a.1|a.1.x|a.1.x.7|a.b.c|...
//   <a<`ab|
//   <a<`abc|
//   <a<`.leading_dot|LEADIN~1
//   ..*`.|
//   ..*`..|
//   abc.<`abc.123|
//
// Line 1 is always a header.  It contains the list of files in the
// collection that were tested.  Each line thereafter is backtick
// delimited, with the input pattern on the left of the backtick, and
// the matching filename on the right.  The matching filename is
// further delimited with a pipe ("|"), where the full filename is
// left of the pipe, and the alternate filename on the right (the RHS
// may be blank).
//
function parse_match_results (results) {

    let file_list = results.split(/\n/)[0].replace(/^TEST FILES:/, "").split("|"),
        match_results = results.split(/\n/).slice(1);

    let wc_matches = {};

    // Let's split up the file list in to its individual files...
    let structured_match_results = match_results.map(res => {
        let pattern = res.split("`")[0],
            matches = res.split("`").slice(1);

        if (!wc_matches.hasOwnProperty(pattern)) {
            wc_matches[pattern] = [];
        }

        matches.forEach(m => {
            let pair = m.split("|");

            wc_matches[pattern].push(pair[0]);
        });
    });

    return {
        files: file_list,
        matches: wc_matches
    };
}

console.log(parse_match_results(results));
