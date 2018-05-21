class PathHelper {

    constructor (context) {
        this.ctx = context;
    }

    Parse (path) {

	// Replace all forward slashes with back slashes...
	path = path.replace(/\//, "\\").toLowerCase();
	path = path.replace(/\\\\/, "");

	let ends_with_path_sep = /\/$/.test(path);

        try {
	    var parsed_path   = pathlib.parse(path),
	        path_parts    = parsed_path.dir.split(/\\/),
	        volume_letter = parsed_path.root.replace(/\\/g, "").toLowerCase();
        }
        catch (e) {

        }

	parsed_path.volume             = volume_letter;
	parsed_path.assumed_folder     = ends_with_path_sep;
	parsed_path.orig_path          = path;
	parsed_path.orig_path_parts    = path.split("\\");
	parsed_path.orig_path_parts_mv = parsed_path.orig_path_parts.slice(1);

	return parsed_path;
    };

    NormalisePathspec (pathspec) {

    }

}

module.exports = PathHelper;
