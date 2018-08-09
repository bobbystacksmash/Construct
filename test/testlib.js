const VirtualFileSystem = require("../src/runtime/virtfs"),
      win32path         = require("path").win32;

var ctx = null;
function make_context (opts) {

    const NOOP = () => {};

    opts = opts || {};

    opts.exceptions  = opts.exceptions  || {};
    opts.environment = opts.environment || {};
    opts.config      = opts.config      || {};
    opts.streams     = opts.streams     || {};

    var default_env = {
        path: "C:\\Users\\Construct"
    };

    var default_cfg = {
        "autovivify": true
    };

    var default_streams = {
        stdin: NOOP,
        stdout: NOOP,
        stderr: NOOP
    };

    let env     = Object.assign({}, default_env,     opts.ENVIRONMENT),
        cfg     = Object.assign({}, default_cfg,     opts.config),
        streams = Object.assign({}, default_streams, opts.streams),
        epoch   = 1234567890;

    var default_assoc = {
        "txt": "Text Document",
        "jpg": "JPEG image"
    };

    function get_file_assoc (f) {

        const extname = win32path
                  .extname(win32path.basename(f))
                  .toLowerCase()
                  .replace(".", "");

        if (default_assoc.hasOwnProperty(extname)) {
            return default_assoc[extname];
        }

        return `${extname} File`;
    }

    let context = {
        epoch: epoch,
        ENVIRONMENT: env,
        CONFIG: cfg,
        emitter: { emit: () => {} },
        exceptions: {},
        vfs: {},
        skew_time_ahead_by: (n) => { this.epoch++ },
        streams: streams,
        get_env: (e) => env[e],
        get_cfg: (c) => cfg[c],
        make_uid: () => 1,
        find_hook: () => {},
        get_file_association: f => get_file_assoc(f)
    };

    let new_ctx = Object.assign({}, context, opts);

    let vfs = new VirtualFileSystem(new_ctx);
    new_ctx.vfs = vfs;

    // We set this just so code outside of this function can access
    // the created context object should it need to.
    ctx = new_ctx;
    vfs.AddFolder(ctx.get_env("path"));

    return ctx;
}

module.exports = make_context;
