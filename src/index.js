/*
 * XXXXXXXXXXXXXXXXX
 * C O N S T R U C T
 * XXXXXXXXXXXXXXXXX
 *
 * It's like procmon, but for Microsoft JScript.
 *
 */

/*const argparse          = require("minimist");
const beautify          = require("js-beautify");
const Mustache          = require("mustache");
const WScript_API       = require("./winapi/wscript");
const ActiveXObject_API = require("./winapi/activex");
const $                 = require("jquery");
const HostEnvironment   = require("./hostenvironment")*/

const evts              = require("./events");
const EventEmitter2     = require("eventemitter2").EventEmitter2;
const fs                = require("fs");
const detect_globals    = require("acorn-globals");
const WINAPI            = require("./winapi");

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// A R G U M E N T   P A R S I N G
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
let js_file_to_examine = process.argv[2],
    js_file_contents   = fs.readFileSync(js_file_to_examine).toString();

let ee = new EventEmitter2({
    wildcard: true
});


ee.on("DEBUG.**", (D) => {

    switch (D.type) {

        case "get":
            console.log(D);
            handle_GET_property(D);
            break;

        case "constructed":
            handle_NEW(D);
            break;

        default:
            console.log("Unhandled event type: " + D.type);
    }
});

function handle_NEW (D) {

    if (D.args && D.tag === "ActiveXObject") {
        console.log(`[DEBUG] ${D.args[0]} created (via ${D.tag}).`);
    }
}

function handle_GET_property (D) {

    /*if (!D.exists) {
        console.log(`[DEBUG] MISSING PROPERTY ${D.tag}.${D.key} -- please report this as an issue.`);
        console.log(`[DEBUG] Exiting.`);
        process.exit(1);
        return;
    }

    console.log(`[DEBUG] ${D.tag}.${D.key} exists`);*/
}


let winapi = new WINAPI({
    emitter: ee
});


// --[ WIN API ]--
//const WScript       = WScript_API();
//const ActiveXObject = ActiveXObject_API();

// XXXXXXXXXXXXX
// R U N T I M E
// XXXXXXXXXXXXX
try {
    console.log("\nRunning sample");
    console.log("--------------\n");
    let fn = instrument_and_wrap_fn(js_file_contents);
    fn();

}
catch (ex) {
    console.log("\nERROR");
    console.log(ex);
}

function instrument_and_wrap_fn(code) {

    let known_globals = [
        "ActiveXObject",
        "eval",
        "this",
        "String",
        "parseInt",
        "RegExp",
        "Array",
        "Date",
        "WScript"
    ];

    return function () {

        console.log("RUNNING");

		var reserved_regexp = new RegExp("^(?:" + known_globals.join("|") + ")$", "i");

        // Detect globals
        var globals = detect_globals(code);
        var names   = globals.filter((g) => reserved_regexp.test(g.name) === false);

        // TODO: Update this so we do it properly...
        var strict_variable_defs = "";
        names.forEach((n) => {
            strict_variable_defs += `var ${n.name};\n`;
        });

        var code_to_run = strict_variable_defs +";\n\n" +  code;
		let fn = new Function("WScript", "ActiveXObject", "console", "JSON", code_to_run);

        fn(winapi.WScript, winapi.ActiveXObject, console, JSON);
    };
}
