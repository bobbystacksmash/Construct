const table  = require("text-table"),
      wrap   = require("word-wrap");

const DISPATCHER = {
    "WshShell": handle_WshShell,
    "XMLHttpRequest": handle_XMLHttpRequest,
    "Shell.Application": handle_ShellApplication,
    "FileSystemObject": handle_FileSystemObject,
    "ADODBStream": handle_ADODBStream
};

function handle_ADODBStream (event) {

}

function handle_WshShell (event) {

    const prop = event.prop,
          type = event.type;

    if (prop === "specialfolders") {
        return [
            "filesystem",
            "WshShell.specialfolders",
            event.args[0]
        ];
    }
}

function handle_XMLHttpRequest (event) {

    const prop = event.prop,
          type = event.type;

    if (prop === "open" && type === "get") {

        return [
            "network",
            "XMLHttpRequest.open()",
            `${event.args[0]} ${event.args[1]}`
        ];
    }

    return [];
}

function handle_FileSystemObject (event) {

}

function handle_ShellApplication (event) {

    const prop = event.prop,
          type = event.type;

    if (prop === "shellexecute") {

        console.log("\n",wrap(event.args[1], {width: 100}), "\n\n");

        return [
            "exec",
            "ShellApplication.ShellExecute",
            event.args[0]
        ];
    }
}

function gather_IOCs (events, reporter) {

    const output = [];

    events.forEach(event => {

        const handler = DISPATCHER[event.target];

        if (!handler) {
            return;
        }

        let result = handler(event);

        if (result && result.length) {
            output.push(result);
        }
    });

    console.log(table(output));
}


module.exports = gather_IOCs;
