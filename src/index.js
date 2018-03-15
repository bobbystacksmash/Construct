/*
 * XXXXXXXXXXXXXXXXX
 * C O N S T R U C T
 * XXXXXXXXXXXXXXXXX
 *
 */

const Runtime = require("./runtime");

const vorpal          = require("vorpal")();
const vorpal_autocomp = require("vorpal-autocomplete-fs");
const path            = require("path");
const table           = require("text-table");
const evts            = require("./events");
const fs              = require("fs");
const colors          = require("colors");
const events          = require("./events");
const _               = require("lodash");


var runtime = new Runtime({ epoch: new Date().getTime() });

console.log(`Construct version 0.1.0`);
console.log(`BSD License`);
console.log(`Please report bugs to: github.com/blah/bugs`);
console.log(`For help, type "help"`);
console.log(``);

// Vorpal mixed mode:
//
//   https://github.com/dthree/vorpal/wiki/API-%7C-vorpal#vorpalparseargv-options
//

function util_get_table_string(data, title) {

    let str_table = table(data)
        .split("\n")
        .map((row) => ` ${row}`)
        .join("\n");

    return `\n${str_table}\n`;
}

/*
 * ==================
 * COMMAND: Load File
 * ==================
 */
const help_load_file = 
`Load a JScript file from the filesystem.  Once loaded, the code will be ` +
      `analysed and preapred for inspection.`;

function cmd_load_file(args) {

    let FILE = args.FILE,
        self = this;

    runtime = new Runtime({ epoch: new Date().getTime() });

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
	    console.trace(e);
	    
            // TODO: Add a method for "method missing" -- include GH link.
            // TODO: Handle this far, far better!
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
`During the runtime execution of a script (see \`load FILE\`), events are
  generated and captured.  The \`net\` command will dump a list of all URLs
  extracted at runtime from the script by hooking well-known INET objects, 
  such as XMLHttpRequest.`;

function CMD_net (args, callback) {

    args.options = args.options || {};

    // TODO: Add an option to show which route handler was invoked
    //       for any given URL.
    
    let safety       = args.options.safe    || false,
        show_domains = args.options.domains || false,
        show_event   = args.options.event   || false,
        show_uniq    = args.options.uniq    || false,
	show_curl    = args.options.curl    || false,
        self         = this;

    if (!runtime.events || !runtime.events.length) {
        self.log("No events were found -- did you run `load FILE` beforehand?");
        return callback();
    }

    let net_requests = runtime.events.filter((e) => /.*XMLHTTP.*::Open$/i.test(e.event));
    
    if (net_requests.length === 0) {
        console.log(``);
        console.log(` Zero runtime events known to establish network connections were `);
        console.log(` detected during script execution.  Perhaps try the \`deceive\` command, `);
        console.log(` it's designed to coax code in to execution.`);
        console.log(``);
        return callback();
    }

    //
    // F I L T E R I N G
    // =================
    //
    // TODO: Move the generation of the ALL|UNIQ lists in to a block
    //       where they're only evaluated when needed.  This could get
    //       slow if we have a HEAP of events to churn through.
    //
    let all_hostnames  = net_requests.map(
	(e) => [(safety)     ? e.args.safe_hostname : e.args.hostname, (show_event) ? e.event : ""]
    );

    let all_hrefs  = net_requests.map(
	(e) => [(safety)     ? e.args.safe_href : e.args.href, (show_event) ? e.event : ""]
    );

    let uniq_hostnames = _.uniqBy(all_hostnames, x => x[0]),
	uniq_hrefs     = _.uniqBy(all_hrefs, x => x[0]);

    // cURL
    let curl_events = runtime.events.filter(e => "-curl" === e.event).map(e => e.args);

    console.log(``);

    if (show_domains) {
        console.log(` Found ${uniq_hostnames.length} domains:`);
	let table = util_get_table_string(uniq_hostnames);
        console.log(table);
    }
    else {
        // Just show full urls...
        console.log(` Found ${all_hrefs.length} URLs:`);
	let table = util_get_table_string(all_hrefs);
        console.log(table);
    }

    console.log(``);

    if (show_curl) {
	console.log(` cURL`);
	console.log(` ====`);
	let table = util_get_table_string(_.uniq(curl_events.map(e => [e, ""])));
	console.log(table);
    }

    callback();
}

vorpal
    .command("net")
    .option("-s, --safe",    "Make any domains copy/paste safe.")
    .option("-d, --domains", "Display only cpatured domains.")
    .option("-e, --event",   "Display the event which produced this network entry.")
    .option("-u, --uniq",    "Display only unique rows.")
    .option("-c, --curl",    "Display a cURL command to fetch the given href.")
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

function cmd_show_timeline (args, callback) {

    var self = this;

    if (!runtime.events || !runtime.events.length) {
        self.log("No events were found -- did you run `load FILE` beforehand?");
        return callback();
    }

    let events = runtime.events.map((e, i) => {
        
        var event    = e.event.replace("WINAPI.", ""),
            axo_test = /^(ActiveXObject)\.new\.(.+)$/.exec(event);

        if (axo_test) {
            event = `new ${axo_test[1]}("${axo_test[2]}")`;
        }
        
        return [i, event ];
    });

    console.log(util_get_table_string(events));

    callback();
}

vorpal
    .command("timeline")
    .description(CMDHELP_timeline)
    .action(cmd_show_timeline);


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
