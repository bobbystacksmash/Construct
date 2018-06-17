/*
 * XXXXXXXXXXXXXXXXX
 * C O N S T R U C T
 * XXXXXXXXXXXXXXXXX
 *
 */

const VirtualFileSystem = require("../../src/runtime/virtfs");
const vorpal            = require("vorpal")();
const vorpal_autocomp   = require("vorpal-autocomplete-fs");
const sprintf           = require("sprintf-js").sprintf;

const vfs = make_vfs();
vfs.AddFolder("C:\\Users\\Construct");
vfs.AddFile("C:\\Users\\Construct\\hello.txt", "Hello, World!");
vfs.AddFolder("C:\\Users\\Construct\\HelloWorld");

var cwd_path = "C:\\Users\\Construct";

vorpal
    .delimiter(`${cwd_path}> `)
    .show();

//
// DIR command
// ===========
//
function command_dir (args, callback) {

    const xtended_view = args.options.x || false;

    // The columns displayed are:
    //
    // 2018-05-23  10:32    <DIR>          HELLOW~1     HelloWorld
    //
    vfs.FolderListContents(cwd_path).forEach(item => {

        const path = `${cwd_path}\\${item}`;

        let short_filename = vfs.GetShortName(path),
            file_type      = (vfs.IsFolder(path)) ? "<DIR>" : "";

        if (xtended_view) {
            console.log(sprintf(" %-12s %-8s %-13s %-12s %s", "2018-03-12", "11:23", file_type, short_filename, item));
        }
        else {
            console.log(sprintf(" %-12s %-8s %-13s %s", "2018-03-12", "11:23", file_type, item));
        }
    });

    callback();
}

vorpal
    .command("dir")
    .autocomplete(vorpal_autocomp())
    .option("-x", "This displays the short names generated for non-8dot3 file names.")
    .description("Displays a list of files and subdirectories within a directory.")
    .action(command_dir);


function make_vfs (opts) {

    opts = opts || {};

    opts.exceptions  = opts.exceptions  || {};
    opts.environment = opts.environment || {};
    opts.config      = opts.config      || {};

    var default_env = {
        path: "C:\\Users\\Construct"
    };

    var default_cfg = {
        "autovivify": true
    };

    let env   = Object.assign({}, default_env, opts.environment),
        cfg   = Object.assign({}, default_cfg, opts.config),
        epoch = opts.epoch || 1234567890;

    let context = {
        epoch: epoch,
        ENVIRONMENT: env,
        CONFIG: cfg,
        emitter: { emit: () => {} },
        get_env: (e) => env[e],
        get_cfg: (c) => cfg[c]
    };

    let new_ctx = Object.assign({}, context, opts);

    return new VirtualFileSystem(new_ctx);
}
