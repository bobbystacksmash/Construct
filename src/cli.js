#!/usr/bin/env node

const program        = require("commander");
const table          = require("text-table");
const hexy           = require("hexy");
const colors         = require("colors/safe");
const wrap           = require("word-wrap");
const moment         = require("moment");
const path           = require("path");
const HookCollection = require("./hooks");

const Construct = require("../index");

function parse_show_tags (val) {

    let tag_filters = val
            .toLowerCase()
            .split(",")
            .map(v => v.replace(/^\s*|\s*$/g, ""))
            .filter(v => v !== "");

    return tag_filters.map(tf => {

        switch (tf) {
        case "fs":
        case "vfs":
            return "filesystem";

        case "reg":
        case "vreg":
            return "registry";

        case "inet":
        case "network":
        case "internet":
            return "net";

        case "runnable":
        case "executed":
        case "executable":
            return "exec";

        default:
            return tf;
        }
    });
}

function parse_date (dt) {
    return new Date(moment(dt, "YYYY-MM-DD hh:mm:ss"));
}

let file_to_analyse = null;

program
    .version("0.1.0")
    .name("construct")
    .usage("FILE [options]")

    .arguments("<FILE>")
    .action(function (FILE) {
        file_to_analyse = FILE;
    })

    .option(
        "-c, --coverage",
        "Write a HTML coverage report to './html-report'."
    )

    .option(
        "-D, --debug",
        "Prints debug information to STDOUT."
    )

    .option(
        "-d, --date <datestr>",
        "Sets the sandbox clock within the virtualised environment.",
        parse_date
    )

    .option(
        "--list-reporters",
        "Lists all available output reporters."
    )

    .option(
        "-r, --reporter <REPORTER>",
        "Uses the given REPORTER to produce output.",
        "dumpevents"
    )
    .parse(process.argv);


if (program.debug) {
    console.log("DEBUG!");
    process.exit();
}

// =================
// R E P O R T E R S
// =================
if (program.listReporters) {

    let reporters = new Construct({ config: "./construct.cfg" }).reporters;

    if (Object.keys(reporters).length === 0) {
        console.log("No reporters found.");
        process.exit();
    }

    const info = Object.keys(reporters).map(reporter => {
        reporter = reporters[reporter].meta;
        return [reporter.name, reporter.description];
    });

    console.log(table(info));
    process.exit();
}


if (file_to_analyse === null) {
    console.log("Usage: construct FILE [OPTION]...");
    console.log("Try: 'construct --help' for more information.");
    return;
}

try {
    var analyser = new Construct({
        config: "./construct.cfg"
    });

    analyser
        .analyse(file_to_analyse, { reporter: program.reporter })
        .then((results) => {
            console.log(JSON.stringify(results, null, 2));
        })
        .catch((err) => {
            // TODO: add better failure messages here.
            console.log(err);
        });
}
catch (e) {
    console.log(`Error: Unable to find reporter '${program.reporter}'.`);
    console.log(`Use the '--list-reporters' option to view available reporters.`);
    process.exit();
}




// ===============
// C O V E R A G E
// ===============
if (program.coverage) {
    construct.coverage();
    process.exit();
}
