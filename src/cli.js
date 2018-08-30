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
        "-f, --filter <tag>",
        "Display events tagged with <tag>.",
        parse_show_tags,
        ["all"]
    )

    .option(
        "-c, --coverage [FILENAME]",
        "Write a HTML coverage report to CWD.  FILENAME will be generated if omitted."
    )

    .option(
        "-d, --date <datestr>",
        "Sets the sandbox clock for all dates within the virtualised environment.",
        parse_date,
        new Date().toString()
    )

    .option(
        "-r, --reporter <REPORTER>",
        "Uses the given REPORTER to produce output.",
        "dumpevents"
    )

    .option(
        "-d, --debug",
        "Prints debug information to STDOUT."
    )

    .option(
        "--list-reporters",
        "Lists all available output reporters."
    )

    .parse(process.argv);


if (program.debug) {
    console.log("DEBUG!");
    process.exit();
}

let construct = new Construct({
    config: "./construct.cfg"
});
construct.load_reporters("./reporters");

// =================
// R E P O R T E R S
// =================
if (program.listReporters) {

    const reporters = construct.get_reporters();

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

if (program.reporter) {

    try {
        construct.onevent(program.reporter);
    }
    catch (e) {
        console.log(`Error: Unable to find reporter '${program.reporter}'.`);
        console.log(`Use the '--list-reporters' option to view available reporters.`);
        process.exit();
    }
}

if (file_to_analyse === null) {
    console.log("Usage: construct FILE [OPTION]...");
    console.log("Try: 'construct --help' for more information.");
    return;
}


construct.load(file_to_analyse, { coverage: program.coverage });
const res = construct.run();

if (res === false) {
    process.exit();
}

// ===============
// C O V E R A G E
// ===============
if (program.coverage) {
    construct.coverage();
    process.exit();
}
