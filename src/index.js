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
const stats    = require("stats-lite");

const CWScript       = require("./winapi/WScript");
const CActiveXObject = require("./winapi/ActiveXObject");
const evts           = require("./events");
const EventEmitter2  = require("eventemitter2").EventEmitter2;
const fs             = require("fs");
const detect_globals = require("acorn-globals");
const CDate          = require("./Date");
const Eval           = require("./Eval");
const colors         = require("colors");
const events         = require("./events");

var instrumenter = new istanbul.Instrumenter(),
    cover_utils  = istanbul.utils,
    collector    = new istanbul.Collector();

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// A R G U M E N T   P A R S I N G
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
var js_file_to_examine = process.argv[2],
    js_file_contents   = fs.readFileSync(js_file_to_examine).toString();

//
// XXXXXXXXXXXXX
// R U N T I M E
// XXXXXXXXXXXXX

function try_find_execution_date_range(code) {

    const HIGHWATER_MARK = 30.0;

    let start_date           = new Date(), // TODO: Let the user specify this date...
        search_date          = start_date.getTime()
        num_days_to_test     = 90*24,
        subtract_from_date   = 1000*60*60,
        statement_coverage   = [],
        last_cov_percent     = null;

    (async function loop() {
        for (let i = 0; i < num_days_to_test; i++) {

            let results     = await instrument_and_wrap_fn(code, search_date)(),
                cov_percent = results.coverage.report.statements.pct;

            statement_coverage.push({ coverage: cov_percent, date: search_date });

            if (i === 0) continue;

            last_cov = statement_coverage[i-1];

            let change = (((last_cov.coverage - cov_percent) * 100) / 100 * -1).toString();

            if (change > HIGHWATER_MARK) {
                console.log(`Significant date change detected between: ${new Date(search_date)} and ${new Date(last_cov.date)}...`);
            }

            search_date -= subtract_from_date;
        }
    })();

}


try_find_execution_date_range(js_file_contents);




/*(function runtime(timestamp) {
try {
    console.log("\nRunning sample");
    console.log("--------------\n");
    var fn = instrument_and_wrap_fn(js_file_contents, );
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
}());*/

function instrument_and_wrap_fn(code, epoch) {

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

        return new Promise((resolve, reject) => {

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

                let statements = e.report.statements,
                    lines      = e.report.lines,
                    functions  = e.report.functions,
                    branches   = e.report.branches;

                console.log(`---[ COVERAGE REPORT ]---`);
                console.log(` * Statements [${statements.pct}%]: total: ${statements.total}, covered: ${statements.covered}, skipped: ${statements.skipped}`);
                console.log(` * Functions  [${functions.pct}%]: total: ${functions.total}, covered: ${functions.covered}, skipped: ${functions.skipped}`);
                console.log(` * Branches   [${branches.pct}%]: total: ${branches.total}, covered: ${branches.covered}, skipped: ${branches.skipped}`);
                console.log(` * Lines      [${lines.pct}%]: total: ${lines.total}, covered: ${lines.covered}, skipped: ${lines.skipped}`);
            });


            /*ee.on("Date.*", (d) => {
                console.log(d.fn, ":", d.v);
            });*/

            ee.on("DEBUG.**", (D) => {});


            var date      = new CDate({ emitter: ee, epoch: epoch }),
                date_inst = date();

            var context = { 
                emitter: ee,
                date:    date_inst
            };

            let WScript       = new CWScript(context);
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
            function done(x) {


                collector.add(x);

                let key = collector.files()[0];

                let coverage_report = {
                    filename: key,
                    report: cover_utils.summarizeFileCoverage(collector.fileCoverageFor(key))
                };

                resolve({
                    coverage: coverage_report,
                    events:   runtime_events
                });

                if (false) reject();
            }

            var fn = new Function("console", "Date", "WScript", "ActiveXObject", "done", instrumented_code);
            fn(console, date, WScript, ActiveXObject, done);
        });
    };
}
