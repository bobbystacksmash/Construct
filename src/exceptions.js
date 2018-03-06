function throw_path_not_found (info) {
    info = info || {};
    throw {
        name:    "Error",
        message: "Path not found",
        remark:  info.remark || ""
    };
}

function throw_invalid_fn_arg (info) {

    info = info || {};

    throw {
        name:    "TypeError",
        message: "Invalid procedure call or argument",
        remark:  info.remark || ""
    };
}


module.exports = {
    throw_path_not_found: throw_path_not_found,
    throw_invalid_fn_arg: throw_invalid_fn_arg
};
