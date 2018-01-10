/*
 * XXXXXXXXXXXXXXXXX
 * C O N S T R U C T
 * XXXXXXXXXXXXXXXXX
 *
 */

var Runtime = require("./runtime");

const vorpal          = require("vorpal")();
const vorpal_autocomp = require("vorpal-autocomplete-fs");
const path            = require("path");
const table          = require("table");

const evts           = require("./events");
const EventEmitter2  = require("eventemitter2").EventEmitter2;
const fs             = require("fs");
const Eval           = require("./Eval");
const colors         = require("colors");
const events         = require("./events");

var runtime = new Runtime({ epoch: new Date().getTime() });

/*console.log(`Construct version 0.1.0`);
console.log(`BSD License`);
console.log(`Please report bugs to: github.com/blah/bugs`);
console.log(`For help, type "help"`);
console.log(``);*/

// Vorpal mixed mode:
//
//   https://github.com/dthree/vorpal/wiki/API-%7C-vorpal#vorpalparseargv-options
//

/*
 * ==================
 * COMMAND: Load File
 * ==================
 */
const help_load_file = 
`Load a JScript file from the filesystem.  Once loaded, the code will be
analysed and preapred for inspection.`

function cmd_load_file(args) {

    let FILE = args.FILE,
        self = this;

    return new Promise(function (resolve, reject) {

        try {
            var runnable = runtime.load(FILE);
        }
        catch (e) {
            self.log("Error loading runnable code:", e.message);
            reject(e);
        }

        let start_time = new Date().getTime();

        try {
            runnable(function (err, results) {
                if (err) reject(err);

                let time_delta = new Date().getTime() - start_time,
                    cov_stmts  = runtime.coverage.report.statements;

                console.log(``);
                console.log(` Script execution completed in ${time_delta}ms.`);
                console.log(` ${cov_stmts.covered}/${cov_stmts.total} (${cov_stmts.pct}%) of statements were executed.`);
                console.log(` Collected ${runtime.events.length} events.`);
                console.log(``);

                resolve();
            });
        }
        catch (e) {
            self.log("Error with runnable:", e.message);
            reject(e);
        }
    });
}

vorpal
    .command("load <FILE>")
    .autocomplete(vorpal_autocomp())
    .option("-l, --load", "Load, instrument, exececute, and capture events from a JScript file.")
    .description(help_load_file)
    .action(cmd_load_file);


/*
 * ===============
 * COMMAND: `net`
 * ===============
 */
const CMDHELP_net = 
`During the runtime execution of a script (see \`load FILE\`),
events are generated and captured.  The \`net\` command will
dump a list of all URLs extracted at runtime from the script by
hooking well-known INET objects, such as XMLHttpRequest.`;

function CMD_net (args, callback) {

    args.options = args.options || {};

    let safety_first = args.options.safe    || false,
        show_domains = args.options.domains || false,
        show_urls    = args.options.urls    || false, // Show only URLs by default.
        self         = this;

    var domains, urls;

    if (!runtime.events || !runtime.events.length) {
        self.log("No events were found -- did you run `load FILE` beforehand?");
        return callback();
    }

    if (!runtime.interesting_events || runtime.interesting_events.url.length === 0) {

        let stmt_coverage_pct = runtime.coverage.report.statements.pct,
            output_message    = [];

        console.log(``);
        console.log(` Zero runtime events known to establish network connections were `);
        console.log(` detected during script execution.  Perhaps try the \`deceive\` command, `);
        console.log(` it's designed to coax code in to execution.`);

        const STMT_COVERAGE_HWMARK = 30;

        if (stmt_coverage_pct <= STMT_COVERAGE_HWMARK) {
            console.log(``);
            console.log(` Also, the loaded script only executed ${stmt_coverage_pct}% of `);
            console.log(` it's total statements.  This highly suggests something is preventing `);
            console.log(` comprehensive script execution (and you should try \`deceive\`).`);
        }

        console.log(``);

        return callback();
    }

    domains = runtime.interesting_events.url.map((url) => {
        return [(safety_first) ? url.safe_domain : url.domain, url.esrc];
    });

    urls = runtime.interesting_events.url.map((url) => {
        return [(safety_first) ? url.safe_url : url.url, url.esrc];
    });

    console.log(``);

    if ((!show_domains && !show_urls) || (show_urls && !show_domains)) {
        // Just show urls...
        console.log(` Found ${urls.length} URLs:`);
        console.log(table.table(urls));
        console.log(``);
    }
    else if (show_domains) {
        console.log(` Found ${urls.length} domains:`);
        console.log(table.table(domains));
        console.log(``);
    }


    console.log(``);
    callback();
}

vorpal
    .command("net")
    .option("-s, --safe",    "Make any domains copy/paste safe.")
    .option("-u, --urls",    "Display full URLs captured during execution.")
    .option("-d, --domains", "Display only cpatured domains.")
    .description(CMDHELP_net)
    .action(CMD_net);


/*
 * ================
 * COMMAND: deceive
 * ================
 */
const CMDHELP_deceive = 
`Sometimes a script will test its environment and decide (for a great many
reasons) that execution should not continue.  The \`deceive\` command is a
series of tests which attempts to jiggle environmental factors the script may
be testing to determine whether or not it should execute.`;

function CMD_deceive (args, callback) {

}


/*
 * =================
 * COMMAND: timeline
 * =================
 */
const CMDHELP_timeline = 
`Display a list of events in the order they were emitted from the running
script.`



/*
 * =====================
 * COMMAND: show summary
 * =====================
 */

const help_summary = 
`This is summary help. FIXME. FIXME. FIXME.`;

function cmd_show_summary(args, callback) {

    var self = this;

    if (!runtime.events || !runtime.events.length) {
        self.log("No events were found -- did you run `load FILE` beforehand?");
        return callback();
    }

    callback();
}

vorpal
    .command("summary")
    .option("-s, --summary", "Produce a short summary of events captured during script execution.")
    .description(help_summary)
    .action(cmd_show_summary);


vorpal
    .delimiter("(cstruct) ")
    .show();


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
