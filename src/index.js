/*
 * TODO
 * ====
 *
 * [!] Add UI-level information for undefined WinAPI calls.
 *
 */


import './css/normalize.css';
import './css/skeleton.css';
import './css/override.css';

const beautify          = require("js-beautify");
const EventEmitter      = require("events");
const Mustache          = require("mustache");
const detect_globals    = require("acorn-globals");
const WScript_API       = require("./winapi/wscript");
const ActiveXObject_API = require("./winapi/activex");
const winevts           = require("./events");
const $                 = require("jquery");
const ee                = require("./emitter")();

let add_msg = (evt, highlight, ) => {
    add_msg_row({
        highlight: highlight,
        description: evt.desc
    });
};

// +-------------+
// | E V E N T S |
// +-------------+
//
// ADODB Stream
// ============
ee.onwinapi(winevts.WINAPI.ADODB.Open,       add_msg);
ee.onwinapi(winevts.WINAPI.ADODB.Write,      add_msg);
ee.onwinapi(winevts.WINAPI.ADODB.SaveToFile, add_msg);

// XMLHttpRequest
// ==============
ee.onwinapi(winevts.WINAPI.XMLHttpRequest.new,  add_msg);
ee.onwinapi(winevts.WINAPI.XMLHttpRequest.open, add_msg);

ee.onwinapi(winevts.WINAPI.ActiveXObject.new,   add_msg);

//ee.onwinapi(winevts.WINAPI.generic.new,         add_msg);
/*ee.onwinapi(winevts.DEBUG.property_access,      add_msg);
ee.onwinapi(winevts.DEBUG.method_call,          add_msg);

ee.onwinapi(winevts.WINAPI.generic.call,         (x) => alert(x));
ee.onwinapi(winevts.WINAPI.generic.property.set, alert);
ee.onwinapi(winevts.WINAPI.generic.property.get, alert);
ee.onwinapi(winevts.DEBUG.error,                 alert);*/



// --[ WIN API ]--
const WScript       = WScript_API({ emitter: ee });
const ActiveXObject = ActiveXObject_API({ emitter: ee });



// --[ ENV ]--


var btn_dbg, txt_code, txt_argv0, messages, TMPL;


$(() => {

    btn_dbg  = document.getElementById("btn-debug");
    txt_code = document.getElementById("txt-code");
    messages = document.getElementById("messages");

    txt_code.addEventListener("change", () => {
        txt_code.value = beautify(txt_code.value);
    });

    // Arguments
    txt_argv0 = document.getElementById("txt-argv0");

    // Templates
    TMPL = {
        msg_row : document.getElementById("tmpl-info-row").innerHTML,
    };

    btn_dbg.addEventListener("click", function (e) {

        messages.innerHTML = "";

        // Load contents from the textbox...
        let script_contents = txt_code.value;

        let runnable = make_script_env(script_contents);

        try {
            runnable();
        }
        catch (ex) {

            if (ex.name === "Script Requested Shutdown") {
                console.log("[SCRIPT EXITED as expected...]");
            }

            add_msg_row({
                summary: "Exception",
                description: ex.message
            });
        }

    });

});


function add_msg_error(ex) {

    Mustache.parse(TMPL.msg_error);
    var rendered = Mustache.render(TMPL.msg_error, {
        type    : ex.name,
        message : ex.message,
        stack   : ex.stack
    });
    messages.innerHTML += rendered;
}

function add_msg_row (opts) {
    Mustache.parse(TMPL.msg_row);
    var rendered = Mustache.render(TMPL.msg_row, {
        highlight   : opts.highlight   || "",
        description : opts.description || ""
    });
    messages.innerHTML += rendered;
}


function make_script_env(code) {

    return function () {

        console.log("--[ Running Evul Code ]--");

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

		var reserved_regexp = new RegExp("^(?:" + known_globals.join("|") + ")$", "i");

        // Detect globals
        var globals = detect_globals(txt_code.value);
        var names   = globals.filter((g) => reserved_regexp.test(g.name) === false);

        // TODO: Update this so we do it properly...
        var strict_variable_defs = "";
        names.forEach((n) => {
            strict_variable_defs += `var ${n.name};\n`;
        });

        var code_to_run = strict_variable_defs +";\n\n" +  txt_code.value;

		txt_code.value = code_to_run;

        window.WScript = WScript;
		new Function("WScript", "ActiveXObject", code_to_run)(WScript, ActiveXObject);
        //eval(code_to_run);
    };
}
