const urlparse  = require("url-parse");

//
// A small wrapper function around `urlparse'.  All WINAPI methods
// dealing with URLs should be pushed through this function so that
// downstream events processors receive events which are consistent --
// especially given the significance of a URL.
//
module.exports = function (url) {

    let safe_version = url.replace(/^http/, "hxxp").replace(".", "[.]"),
	parsed_parts = urlparse(url, true);

    // Let's also make the hostname safe.
    parsed_parts.safe_hostname = parsed_parts.hostname.replace(/\./g, "[.]");
    parsed_parts.safe_host     = parsed_parts.host.replace(/\./g, "[.]");
    parsed_parts.safe_href     = safe_version;

    return parsed_parts;
};
