const Component         = require("../Component"),
      proxify           = require("../proxify2"),
      JS_WshArguments   = require("./WshArguments"),
      create_instance   = require("./support/create_instance");

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


module.exports = function create(context, options) {

    class JS_WScript extends Component {

        constructor (context, options) {
            options = options || {};
	    super(context, "WScript");
        }

        //
        // PROPERTIES
        // ==========

        get application () {
            return this;
        }

        // WScript.Arguments: https://msdn.microsoft.com/en-us/library/z2b05k8s(v=vs.84).aspx
        get arguments () {
            const default_options = {
                arguments: []
            };

            let opts = Object.assign(default_options, options);
            return JS_WshArguments(context, opts.arguments);
        }

        // WScript.BuildVersion      https://msdn.microsoft.com/en-us/library/kt8ycte6(v=vs.84).aspx
        get buildversion () {
	    let build_version = context.ENVIRONMENT.BuildVersion;
	    return build_version;
        }

        set buildversion (_) {
            // READ ONLY PROPERTY
            context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WScript",
                "The .BuildVersion property cannot be set.",
                "The .BuildVersion property cannot be set."
            );
        }

        // FullName https://msdn.microsoft.com/en-us/library/z00t383b(v=vs.84).aspx
        get fullname () {
	    let full_name = context.ENVIRONMENT.FullName;
	    return full_name;
        }

        set fullname (_) {
            // READ ONLY PROPERTY
            context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WScript",
                "The .FullName property cannot be set.",
                "The .FullName property cannot be set."
            );
        }

        // Interactive https://msdn.microsoft.com/en-us/library/b48sxsw0(v=vs.84).aspx
        get interactive () {
	    let interactive = context.ENVIRONMENT.Interactive;
	    return interactive;
        }

        set interactive (_) {
        }


        // Name https://msdn.microsoft.com/en-us/library/3ktf76t1(v=vs.84).aspx
        get name () {
	    let name = context.ENVIRONMENT.Name;
	    return name;
        }

        set name (_) {
            context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WScript",
                "Cannot set .Name",
                "The .Name property is read-only."
            );
        }


        // Path https://msdn.microsoft.com/en-us/library/sw3e6ehs(v=vs.84).aspx
        //
        // Returns the name of the directory containing the host
        // executable (CScript.exe or WScript.exe).
        get path () {
	    let path = context.ENVIRONMENT.Path;
	    return path;
        }

        set path (_) {
            context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WScript",
                "Cannot set .Path",
                "The .Path property is read-only."
            );
        }


        // ScriptFullName    https://msdn.microsoft.com/en-us/library/cc5ywscw(v=vs.84).aspx
        get scriptfullname () {
	    let script_full_name = context.get_env("ScriptFullName");
	    return script_full_name;
        }

        set scriptfullname (_) {
            context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WScript",
                "Cannot set .ScriptFullName",
                "The .ScriptFullName property is read-only."
            );
        }


        // ScriptName        https://msdn.microsoft.com/en-us/library/3faf1xkh(v=vs.84).aspx
        get scriptname () {
	    let script_name = context.ENVIRONMENT.ScriptName;
	    return script_name;
        }

        set scriptname (_) {
            context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WScript",
                "Cannot set .ScriptName",
                "The .ScriptName property is read-only."
            );
        }

        // StdErr https://msdn.microsoft.com/en-us/library/hyez2k48(v=vs.84).aspx
        get stderr () {
	    return null;
        }

        // StdIn https://msdn.microsoft.com/en-us/library/1y8934a7(v=vs.84).aspx
        get stdin () {
	    return null;
        }

        // StdOut https://msdn.microsoft.com/en-us/library/c61dx86d(v=vs.84).aspx
        get stdout () {
	    return null;
        }

        // Version https://msdn.microsoft.com/en-us/library/kaw07b53(v=vs.84).aspx
        get version () {
	    let version = context.config.ENVIRONMENT.Version;
	    return version;
        }

        set version (_) {
            context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
                "WScript",
                "Cannot set .Version property",
                "The .Version property is read-only."
            );
        }


        //
        // METHODS
        // =======
        //
        connectobject () {
        }

        createobject (type) {

            try {
                let instance = create_instance(context, type);
                return instance;
            }
            catch (e) {

                if (e.message.includes("Unknown instance type")) {
                    context.exceptions.throw_could_not_locate_automation_class(
                        "WScript",
                        "CreateObject cannot create an object for the given type.",
                        `Unable to create an object because type: "${type}" is unknown ` +
                            "or not supported by the sandbox at this time.",
                        type
                    );
                }

                throw e;
            }
        }

        disconnectobject () {
        }

        echo (...args) {
	    let msg = args.join(" ");
            context.write_to_output_buf(msg);

	    if (context.output_behaviour === "repl") {
	        console.log(" > ", ...args);
	    }
        }

        getobject () {
        }

        quit (exit_code) {
            //context.shutdown(exit_code);
        }

        sleep (ms) {
            let old_time = context.epoch;
	    context.skew_time_ahead_by(ms);
            let new_time = context.epoch;
        }
    }

    let wscript = new JS_WScript(context, options);
    return proxify(context, wscript);
};
