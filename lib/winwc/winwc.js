const path = require("path").win32;

function find_all_files (file_expr, list_of_cwd_files) {
    console.log("FILES", file_list);
    console.log("MATCHES", pattern);
}


function normalise_expr (file_expr) {

    if (file_expr.startsWith("\\\\?\\") === false) {
        return file_expr;
    }

    let path_endswith_period = /\.$/.test(file_expr);

    file_expr = file_expr
        .replace(/\?/g,     ">")
        .replace(/\.[?*]/g, '"');

    // A path ending in '*' that had a final period before normalizing
    // is changed to '<'.
    if (path_endswith_period) {
        file_expr.replace(/\\.$/, "<");
    }

    file_expr = path.normalize(file_expr);

    // If the path doesn't end in a separator, all trailing periods
    // and spaces (charater code 32 only) will be removed.
    file_expr = file_expr.replace(/[\s.]*$/g, "");

    return file_expr;
}


module.exports = {
    find_all_files: find_all_files,
    normalise_expr: normalise_expr
};
