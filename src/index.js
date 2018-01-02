/*
 * XXXXXXXXXXXXXXXXX
 * C O N S T R U C T
 * XXXXXXXXXXXXXXXXX
 *
 * It's like procmon, but for Microsoft JScript.
 *
 */

var WScript       = require("./winapi/WScript");
var ActiveXObject = require("./winapi/ActiveXObject");
var evts              = require("./events");
var EventEmitter2     = require("eventemitter2").EventEmitter2;
var fs                = require("fs");
var detect_globals    = require("acorn-globals");
var WINAPI            = require("./winapi");
var _Date             = require("./Date");

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// A R G U M E N T   P A R S I N G
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
var js_file_to_examine = process.argv[2],
    js_file_contents   = fs.readFileSync(js_file_to_examine).toString();

var ee = new EventEmitter2({
    wildcard: true
});


ee.on("Date.*", (d) => {
    console.log(d.fn, ":", d.v);
});

ee.on("DEBUG.**", (D) => {});

function handle_NEW (D) {

    if (D.args && D.tag === "ActiveXObject") {
        console.log(`[DEBUG] ${D.args[0]} created (via ${D.tag}).`);
    }
}

function handle_GET_property (D) {

    var key = String(D.key);

    if (! D.exists) {
        debugger;
        console.log(`[DEBUG] MISSING PROPERTY ${D.tag}.${key} -- please report this as an issue.`);
        process.exit(1);
        return;
    }
    console.log(`[DEBUG] ${D.tag}.${key} exists`);
}


// XXXXXXXXXXXXX
// R U N T I M E
// XXXXXXXXXXXXX
try {
    console.log("\nRunning sample");
    console.log("--------------\n");
    var fn = instrument_and_wrap_fn(js_file_contents);
    fn();

}
catch (ex) {
    console.log("\nERROR");
    console.log(ex);
}

function instrument_and_wrap_fn(code) {

    var known_globals = [
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

        var code_to_run = strict_variable_defs +";\n\ndebugger;" +  code;

        var date      = new _Date({ emitter: ee }),
            date_inst = date();

        var context = { 
            emitter: ee,
            date:    date_inst
        };

        var wscript = new WScript(context);
            activex = new ActiveXObject(context);

		var fn = new Function("console", "Date", "WScript", "ActiveXObject", code_to_run);
        fn(console, date, wscript, activex);
    };
}
