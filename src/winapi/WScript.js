const Component = require("../Component");
const proxify   = require("../proxify2");

/* MSDN: https://msdn.microsoft.com/en-us/library/at5ydy31(v=vs.84).aspx
 *
 * WScript
 * =======
 *
 * The WScript object is the root object of the Windows Script Host
 * object model hierarchy. It never needs to be instantiated before
 * invoking its properties and methods, and it is always available
 * from any script file. The WScript object provides access to
 * information such as:
 *
 *  > command-line arguments,
 *  > the name of the script file,
 *  > the host file name,
 *  >  and host version information.
 *
 * The WScript object allows you to:
 *
 *  > create objects,
 *  > connect to objects,
 *  >  disconnect from objects,
 *  > sync events,
 *  > stop a script's execution programmatically,
 *  > output information to the default output device (either a Windows
 *    dialog box or the command console).
 *
 * The WScript object can be used to set the mode in which the script
 * runs (either interactive or batch).
*/

class JS_WScript extends Component {

    constructor (context) {
	super(context, "WScript");
	this.ee = this.context.emitter;
    }

    //
    // PROPERTIES
    // ==========

    // WScript.Arguments: https://msdn.microsoft.com/en-us/library/z2b05k8s(v=vs.84).aspx
    get arguments () {
	let args = this.context.ENVIRONMENT.Arguments;
	this.ee.emit("@WScript::Arguments", args);
	return args;
    }

    // WScript.BuildVersion      https://msdn.microsoft.com/en-us/library/kt8ycte6(v=vs.84).aspx
    get buildversion () {
	let build_version = this.context.ENVIRONMENT.BuildVersion;
	this.ee.emit("@WScript::BuildVersion", build_version);
	return build_version;
    }


    // FullName https://msdn.microsoft.com/en-us/library/z00t383b(v=vs.84).aspx
    get fullname () {
	let full_name = this.context.ENVIRONMENT.FullName;
	this.ee.emit("@WScript::FullName", full_name);
	return full_name;
    }


    // Interactive https://msdn.microsoft.com/en-us/library/b48sxsw0(v=vs.84).aspx
    get interactive () {
	let interactive = this.context.ENVIRONMENT.Interactive;
	this.ee.emit("@WScript::Interactive", interactive);
	return interactive;
    }


    // Name https://msdn.microsoft.com/en-us/library/3ktf76t1(v=vs.84).aspx
    get name () {
	let name = this.context.ENVIRONMENT.Name;
	this.ee.emit("@WScript::Name", name);
	return name;
    }


    // Path              https://msdn.microsoft.com/en-us/library/sw3e6ehs(v=vs.84).aspx
    get path () {
	let path = this.context.ENVIRONMENT.Path;
	this.ee.emit("@WScript::Path", path);
	return path;
    }


    // ScriptFullName    https://msdn.microsoft.com/en-us/library/cc5ywscw(v=vs.84).aspx
    get scriptfullname () {
	let script_full_name = this.context.ENVIRONMENT.ScriptFullName;
	this.ee.emit("@WScript::ScriptFullName", script_full_name);
	return script_full_name;
    }


    // ScriptName        https://msdn.microsoft.com/en-us/library/3faf1xkh(v=vs.84).aspx
    get scriptname () {
	let script_name = this.context.ENVIRONMENT.ScriptName;
	this.ee.emit("@WScript::ScriptName", script_name);
	return script_name;
    }


    // StdErr https://msdn.microsoft.com/en-us/library/hyez2k48(v=vs.84).aspx
    get stderr () {
	this.ee.emit("@WScript::StdErr", "ERROR: NOT IMPLEMENTED!");
	return null;
    }

    // StdIn https://msdn.microsoft.com/en-us/library/1y8934a7(v=vs.84).aspx
    get stdin () {
	this.ee.emit("@WScript::StdIn", "ERROR: NOT IMPLEMENTED!");
	return null;
    }

    // StdOut https://msdn.microsoft.com/en-us/library/c61dx86d(v=vs.84).aspx
    get stdout () {
	this.ee.emit("@WScript::StdOut", "ERROR: NOT IMPLEMENTED!");
	return null;
    }


    // Version https://msdn.microsoft.com/en-us/library/kaw07b53(v=vs.84).aspx
    get version () {
	let version = this.context.ENVIRONMENT.Version;
	this.ee.emit("@WScript.Version", version);
	return version;
    }


    //
    // METHODS
    // =======
    echo (...args) {
	let msg = args.join(" ");
	this.ee.emit("@WScript::Echo", { msg: msg }, arguments);

	if (this.context.output_behaviour === "repl") {
	    console.log(" > ", ...args);
	}
    }


    getobject () {
	this.ee.emit("@WScript::GetObject", "ERROR: NOT IMPLEMENTED!");
    }


    quit () {
	this.ee.emit("@WScript::Quit", "ERROR: NOT IMPLEMENTED!");
	// TODO
    }


    sleep (ms) {
	this.context.skew_time_ahead_by(ms);
	console.log("@WScript::Sleep", "ERROR: NOT IMPLEMENTED!", arguments);
	this.ee.emit("@WScript::Sleep", "ERROR: NOT IMPLEMENTED!");
    }

    createobject () {
	this.ee.emit("@WScript::CreateObject", "ERROR: NOT IMPLEMENTED!");
    }


    connectobject () {
	this.ee.emit("@WScript::ConnectObject", "ERROR: NOT IMPLEMENTED!");
    }


    disconnectobject () {
	this.ee.emit("@WScript::DisconnectObject", "ERROR: NOT IMPLEMENTED!");
    }

    sleep (ms) {
        this.context.skew_time_ahead_by(ms);
    }
}


module.exports = function create(context) {
    let wscript = new JS_WScript(context);
    return proxify(context, wscript);
};
