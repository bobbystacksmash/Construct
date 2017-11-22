/*
 * TODO
 * ====
 *
 * [!] Add UI-level information for undefined WinAPI calls.
 * [!] Add a nicer "fixer-upper" for adding undefined globals.
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

const winevts                = require("./events");
const ee = new EventEmitter();

ee.on(winevts.WINAPI.generic.new,          (x) => add_msg_construct({ parent: x.obj, arg: x.arg }));
ee.on(winevts.WINAPI.generic.call,         console.log);
ee.on(winevts.WINAPI.generic.property.set, console.log);
ee.on(winevts.WINAPI.generic.property.get, console.log);
ee.on(winevts.DEBUG.error,                 (e) => add_msg_error(e));
ee.on(winevts.DEBUG.property_access,       (p) => add_msg_prop_access(p));

// --[ WIN API ]--
const WScript       = WScript_API({ emitter: ee });
const ActiveXObject = ActiveXObject_API({ emitter: ee });



var btn_dbg, txt_code, txt_argv0, messages, TMPL;

document.addEventListener("DOMContentLoaded", function (evt) {
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
        msg_construct   : document.getElementById("tmpl-msg-construct").innerHTML,
        msg_prop_access : document.getElementById("tmpl-msg-prop-access").innerHTML,
        msg_error       : document.getElementById("tmpl-msg-exception").innerHTML,
        msgrow          : document.getElementById("tmpl-msgrow").innerHTML,

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

            add_msg_error(ex);
        }

    });

});

function add_msg_prop_access(prop) {
    Mustache.parse(TMPL.msg_prop_access);
    var rendered = Mustache.render(TMPL.msg_prop_access, {
        key: prop.key,
        tag: prop.tag
    });
    messages.innerHTML += rendered;
}


function add_msg_error(ex) {

    Mustache.parse(TMPL.msg_error);
    var rendered = Mustache.render(TMPL.msg_error, {
        type    : ex.name,
        message : ex.message,
        stack   : ex.stack
    });
    messages.innerHTML += rendered;
}



function add_msg_construct(opts) {
    Mustache.parse(TMPL.msg_construct);
    var rendered = Mustache.render(TMPL.msg_construct, {
        parent: opts.parent,
        arg   : opts.arg || ""
    });
    messages.innerHTML += rendered;
}


function add_msg(opts) {
    Mustache.parse(TMPL.msgrow);
    var rendered = Mustache.render(TMPL.msgrow, {
        title: opts.title,
        msg: opts.msg
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
			alert(n.name);
        });

        var code_to_run = strict_variable_defs + txt_code.value;

		txt_code.value = code_to_run;

		new Function("WScript", "ActiveXObject", code_to_run)(WScript, ActiveXObject);
        //eval(code_to_run);
    };
}
