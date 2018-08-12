class Router {

    constructor () {
        this.routes = {
            method: [],
            getter: [],
            setter: [],
            cstor:  []
        };
    }

    match (type, path) {

        function find_hook (hook) {

            if (hook.match instanceof RegExp && hook.match.test(path)) {
                return true;
            }
            else if (hook.match instanceof Function && hook.match(path)) {
                return true;
            }
            else if (hook.match === path) {
                return true;
            }
            else {
                return false;
            }
        }

        if (type === "method") {
            const hook = this.routes.method.find(hook => find_hook(hook));

            if (hook) {
                return hook.fn
            }
        }
    }

    method (match, fn) {
        this.routes.method.push({ match: match, fn: fn });
    }

    getter (match, fn) {
        this.routes.getter.push({ match: match, fn: fn });
    }

    setter (match, fn) {
        this.routes.setter.push({ match: match, fn: fn });
    }

    cstor (match, fn) {
        this.routes.cstor.push({ match: match, fn: fn });
    }
}

module.exports = Router;
