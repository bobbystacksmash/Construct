/*
 * XXXXXXXXXXXXXXXXX
 * C O N S T R U C T
 * XXXXXXXXXXXXXXXXX
 *
 * It's like procmon, but for Microsoft JScript.
 *
 */


// http://perfectionkills.com/global-eval-what-are-the-options/#how_eval_works

const istanbul = require("istanbul");

var CWScript       = require("./winapi/WScript");
var CActiveXObject = require("./winapi/ActiveXObject");
var evts              = require("./events");
var EventEmitter2     = require("eventemitter2").EventEmitter2;
var fs                = require("fs");
var detect_globals    = require("acorn-globals");
var WINAPI            = require("./winapi");
var _Date             = require("./Date");
var Eval             = require("./Eval");
var colors           = require("colors");
var events           = require("./events");

var EVAL = eval;

const vm = require("vm");

var instrumenter = new istanbul.Instrumenter(),
    cover_utils  = istanbul.utils,
    collector    = new istanbul.Collector();

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// A R G U M E N T   P A R S I N G
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
var js_file_to_examine = process.argv[2],
    js_file_contents   = fs.readFileSync(js_file_to_examine).toString();

var ee = new EventEmitter2({
    wildcard: true
});


var runtime_events = [];

ee.on("**", function (x) {

    if (this.event.startsWith("DEBUG") || this.event.startsWith("Report"))
        return;

    runtime_events.push({ 
        event: this.event, 
        args: x, 
        t: new Date().getTime() 
    });
});

ee.on("Report.coverage", (e) => {
    console.log(e);
});


/*ee.on("Date.*", (d) => {
    console.log(d.fn, ":", d.v);
});*/

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
(function runtime(timestamp) {
try {
    console.log("\nRunning sample");
    console.log("--------------\n");
    var fn = instrument_and_wrap_fn(js_file_contents);
    fn();

    runtime_events.forEach((e) => {
        if (e.event.startsWith("DEBUG"))
            return;

        var event_name = e.event.replace(/^WINAPI\./, ""),
            output     = `${event_name}(`;

        console.log(event_name.underline.yellow);
        if (Object.keys(e.args).length > 0) {
            Object.keys(e.args).forEach((arg) => {
                let val = e.args[arg];
                console.log(`    ${arg.cyan}: ${val}`);
            });
            console.log("\n");
        }


    });

    // Date check (experiment)
    console.log("---[ FINISHED ]---");
    console.log(`Captured a total of ${runtime_events.length} events...`);
}
catch (ex) {
    console.log("\nERROR");
    console.log(ex);
}
}());

function instrument_and_wrap_fn(code, timestamp) {

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

        var date      = new _Date({ emitter: ee }),
            date_inst = date();

        var context = { 
            emitter: ee,
            date:    date_inst
        };


        var WScript       = new CWScript(context);
            ActiveXObject = new CActiveXObject(context);

		var reserved_regexp = new RegExp("^(?:" + known_globals.join("|") + ")$", "i");

        // Detect globals
        var globals = detect_globals(code);
        var names   = globals.filter((g) => reserved_regexp.test(g.name) === false);

        // TODO: Update this so we do it properly...
        var strict_variable_defs = "";
        names.forEach((n) => {
            strict_variable_defs += `var ${n.name};\n`;
        });


        var code_to_run = strict_variable_defs + "\n\ndebugger;\n\n" +  code,
            instrumented_code = instrumenter.instrumentSync(code_to_run, js_file_to_examine); // RAGING FIXME
            instrumented_code += ";done(__coverage__)";                                       // ============
                                                                                              // Need to do something to make a coverage var
                                                                                              // that's unlikely to collide with code...

        function done(x) {
            collector.add(x);
            collector.files().forEach(function (key) {
                ee.emit(events.Report.coverage, {
                    filename: key,
                    report: cover_utils.summarizeFileCoverage(collector.fileCoverageFor(key))
                });
            });
        }

		var fn = new Function("console", "Date", "WScript", "ActiveXObject", "done", instrumented_code);
        fn(console, date, WScript, ActiveXObject, done);
    };
}
