
/*
 * ==================
 * XMLHttpRequest API
 * ==================
 */

function proxied_XMLHttpRequest (tag, target) {

    var handler = {

            apply (target, ctx, args) {
                console.info(`${tag} :: APPLY called with ${args.length} args`);
                return Reflect.apply(...arguments);
            },

            get (target, key, trap) {

                console.info(`${tag} :: GET on "${key}`);

                if (typeof target[key] === 'function') {

                    console.info(`${tag} :: is a function...`);

                    switch (key) {
                    case "open":
                        return (method, url, asyn, user, password) => {
                            console.info(`${tag} :: XHR.open(${method}, ${url}, ${asyn})`);

                            // Translate the URL to something that won't violate CORS:
                            let new_url = "http://localhost:3000/fetch/" + encodeURIComponent(url);

                            console.info(`${tag} :: ${url} -> ${new_url}`);

                            return target[key](method, new_url, asyn, user, password);
                        };

                    default:
                        return (...args) => {
                            console.info(`${tag} :: XHR.${key}(${args})`);
                            return target[key](...args);
                        };
                    }
                }
                else {

                    if (key == "Status") key = "status";

                    return target[key];
                }
            },

            set (target, key, value) {
                console.info(`${tag} :: SET on "${key}" with "${value}"`);
                return true;
            },

            construct (target, args) {
                console.info(`${tag} :: NEW called with ${args.length} args`);
                return new target(...args);
            }
        };

    return new Proxy(target, handler);
};

module.exports = proxied_XMLHttpRequest;
