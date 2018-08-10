#!/usr/bin/env node

const program = require("commander");
const table   = require("text-table");
const hexy    = require("hexy");
const colors  = require("colors/safe");
const wrap    = require("word-wrap");
const moment  = require("moment");
const path    = require("path");

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
        "-d, --date <datestr>",
        "Sets the sandbox clock for all dates within the virtualised environment.",
        parse_date,
        new Date().toString()
    )

    // TODO
    .option(
        "--plugins <PLUGINS>",
        "Additional directories to load plugins from (colon separated).",
        () => [],
        path.join(process.cwd(), "plugins")
    )

    .option(
        "--reporter <REPORTER>",
        "Uses the given REPORTER to produce output.",
        "json"
    )

    .option(
        "--list-reporters",
        "Lists all available output reporters."
    )

    .parse(process.argv);

if (file_to_analyse === null) {
    console.log("Usage: construct FILE [OPTION]...");
    console.log("Try: 'construct --help' for more information.");
    return;
}

const cstruct = new Construct({ epoch: program.date });
cstruct.load_reporters("./reporters");
cstruct.load(file_to_analyse);

if (program.writeRunnable) {
    process.exit();
}

const run_result = cstruct.run();

// todo: handle run_result.timed_out:true.

const events = cstruct.events(e => {
    return e.tags.some(t => {
        return program.filter.some(s => s === "all" || s === t);
    });
});

if (program.IOCs) {
    cstruct.IOCs(events);
}
else {

    cstruct.apply_reporter("dumpreg", events);

    //console.log(JSON.stringify(events));
    /*const cov = cstruct.coverage("x");
    console.log(JSON.stringify(cov));*/
}
