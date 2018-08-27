const Router = require("./hookrouter"),
      glob   = require("glob"),
      path   = require("path"),
      fs     = require("fs");

class HookCollection {

    constructor (hooks_dir, filterfn) {
        this.router = new Router();
        this.load_hooks(hooks_dir);
    }

    match (obj) {

        if (!obj.hasOwnProperty("name") || !obj.hasOwnProperty("property") || ! obj.hasOwnProperty("type")) {
            return false;
        }

        const path = `${obj.name.toLowerCase()}.${obj.property.toLowerCase()}`;


        switch (obj.type.toLowerCase()) {
        case "method":
            return this.router.match("method", path);
        case "getter":
            return this.router.match("getter", path);
        case "setter":
            return this.router.match("setter", path);
        default:
            console.log("HOOKER UNKOWN", obj.type);
            return false;
        }
    }

    load_hooks (path_to_hooks_dir) {

        path_to_hooks_dir = path_to_hooks_dir.replace(/\/*$/, "");

        let globpat = `${path_to_hooks_dir}/**/*.js`;

        glob.sync(globpat).forEach(hook_file => {

            let hook_file_path = path.resolve(hook_file);

            try {
                const hook = require(path.resolve(hook_file_path));
                hook(this.router);
            }
            catch (e) {
                throw new Error(`Unable to load hook file: ${hook_file}: ${e.message}`);
            }
        });
    }

    add_hook (hook) {
        hook(this.router);
    }
}

module.exports = HookCollection;
