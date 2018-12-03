const VirtualFileSystem = require("./virtfs");
const VirtualRegistry   = require("./virtreg");
const EventEmitter2     = require("eventemitter2").EventEmitter2;
const ExceptionHandler = require("../ExceptionHandler");
const JScript_Date          = require("../winapi/Date");
const JScript_Math          = require("../winapi/Math");
const JScript_WScript       = require("../winapi/WScript");
const JScript_ActiveXObject = require("../winapi/ActiveXObject");
const JScript_TextStream    = require("../winapi/TextStream");
const JScript_WshArguments  = require("../winapi/WshArguments");
const win32path = require("path").win32;
const path = require("path");
const fs   = require("fs");

class HostContext {

    constructor(opts) {

        this.output_buf = [];
        this.hooks = opts.hooks || [];
        this.instances = [];

        this._event_tracking = {
            // Maps instance __id__ to true|false.
        };

        // Configuration
        // =============
        this.environment  = opts.config.environment;
        this.config       = opts.config;
        this.DEBUG        = opts.config.general.debug || false;

        this.default_nethook_response = {
            body: "CONSTRUCT-BODY",
            status: 200,
            headers: {
                "Content-Length": "CONSTRUCT-BODY".length
            }
        };

        this.default_exechook = {
            cmd: "",
            stdout: "",
            stdin: "",
            stderr: ""
        };

	this.make_uid = (function () { var i = 0; return () => i++; }());

	// All components (ActiveXObject, WScript.Shell, ...) are
	// expected to register with the `HostContext' when
	// instantiated.  This is not true of so-called "hidden"
	// components, such as those used by Construct behind the
	// scenes.
	this.component_register = [];
	this.global_objects         = {};

	//
	// The emitter is how all events in Construct are passed
	// around.
	this.emitter = opts.emitter || new EventEmitter2({ wildcard: true });
	//
	// Every component has an ID which allows event reconciliation
	// to occur after the JScript code has finished.
	this._id = this.make_uid();
	//
	// The `epoch' value tracks a date (in miliseconds) from when
	// the exact time the script is being run at.  This allows us
	// to change time drastically without hard-coding a date value
	// anywhere.  In the absence of an `opts.epoch' value, we
	// fall-back to using the system's time.
	this.epoch = opts.config.environment.epoch || new Date().getTime();

        // We need to create the Standard{In,Out,Err} streams, which
        // are just differently configured instances of a TextStream
        // object.
        this.streams = {};

        const NOT_READABLE  = false,
              NOT_WRITEABLE = 0,
              IS_READABLE   = true,
              IS_WRITEABLE  = 1;

        this.streams.stdin = new JScript_TextStream(
            this,
            { stream: "stdin" },
            IS_READABLE,
            NOT_WRITEABLE
        );

        this.streams.stderr = new JScript_TextStream(
            this,
            { stream: "stderr" },
            NOT_READABLE,
            IS_WRITEABLE
        );

        this.streams.stdout = new JScript_TextStream(
            this,
            { stream: "stdout" },
            NOT_READABLE,
            IS_WRITEABLE
        );

	this._setup_global_objects();

        // Create the files specified in the config...
        this._create_filesystem(opts.config.environment.filesystem);
        this._create_registry(opts.config.environment.registry);

        this._prepare_nethooks(opts.config.network);
        this._prepare_exechooks(opts.config.exec);
    }

    _prepare_exechooks (exec_cfg) {

        let exechooks = [];

        Object.keys(exec_cfg).forEach(ekey => {

            let ehook  = Object.assign(this.default_exechook, exec_cfg[ekey]),
                stdout = ehook.stdout,
                stdin  = ehook.stdin,
                stderr = ehook.stderr;

            // Match on command
            var cmd = ehook.cmd;
            if (cmd.startsWith("/") && cmd.endsWith("/")) {
                try {
                    cmd = cmd.replace(/^\//, "").replace(/\/$/, "");
                    cmd = new RegExp(cmd, "g");
                }
                catch (e) {
                    console.log(`Error parsing exec hook ${ekey} - cmd: '${ehook.cmd}'.`);
                    console.log(e.message);
                    process.exit();
                }
            }

            ehook.matches = (exec_command) => {
                try {
                    if (cmd instanceof RegExp) {
                        return cmd.test(exec_command);
                    }
                    else {
                        return cmd.toLowerCase() === exec_command.toLowerCase();
                    }
                }
                catch (_) {
                    return false;
                }
            };

            exechooks.push(ehook);
        });

        this.exechooks = exechooks;
    }

    _prepare_nethooks (netcfg) {

        let responses = [];

        Object.keys(netcfg.response).forEach(rkey => {

            let res  = Object.assign(this.default_nethook_response, netcfg.response[rkey]),
                body = res.body;

            // NETWORK ADDRESS (URL)
            // =====================
            var reurl = res.url;
            if (res.url.startsWith("/") && res.url.endsWith("/")) {
                try {
                    reurl = res.url.replace(/^\//, "").replace(/\/$/, "");
                    reurl = new RegExp(reurl, "ig");
                }
                catch (e) {
                    console.log(`Error compiling network response regexp URL: '${reurl}':`);
                    console.log(e.message);
                    process.exit();
                }
            }
            res.match_url = (url) => {
                if (reurl instanceof RegExp) {
                    return reurl.test(url);
                }
                else {
                    return url.toLowerCase().includes(reurl);
                }
            };

            // BODY
            // ====
            if (res.body.startsWith("@")) {

                let bodypath = path.resolve(res.body.replace(/^@/, ""));
                try {
                    body = fs.readFileSync(bodypath).toString();
                }
                catch (e) {
                    console.log(`Error loading file '${bodypath}':`);
                    console.log(e.message);
                    process.exit();
                }
            }

            res.body = body;
            res.headers["Content-Length"] = Buffer.from(body).length;

            // Response Headers
            // ================
            if (res.hasOwnProperty("contentType")) {
                res.headers["Content-Type"] = res.contentType;
            }
            else {
                res.headers["Content-Type"] = "text/html";
            }

            responses.push(res);
        });

        this.nethooks = responses;
    }


    _setup_global_objects () {

	this.global_objects["VirtualFileSystem"] = new VirtualFileSystem(this);
	this.register("VirtualFileSystem", this.global_objects["VirtualfileSystem"]);
	this.vfs = this.global_objects["VirtualFileSystem"];

        this.global_objects["VirtualRegistry"] = new VirtualRegistry(this);
        this.register("VirtualRegistry", this.global_objects["VirtualRegistry"]);
        this.vreg = this.global_objects["VirtualRegistry"];

	// The exception-thrower guards against VM code throwing
	// exceptions without providing sufficient documentation that
	// will help when investigating a sample.  It's accessable
	// from all components, and ensures we get exceptions with
	// vital information, including:
	//
	//   * the component which threw the exception,
	//   * a summary of WHY the exception was thrown,
	//   * and a detailed description to give context.
	//
	this.global_objects["Exceptions"] = new ExceptionHandler(this);
	this.register("Exceptions", this.global_objects["Exceptions"]);
	this.exceptions = this.global_objects["Exceptions"];

	// =============
	// ActiveXObject
	// =============
	this.global_objects["ActiveXObject"] = new JScript_ActiveXObject(this);
	this.register("ActiveXObject", this.global_objects["ActiveXObject"]);

	// =======
	// D A T E
	// =======
	//
	// From JScript, this component is used just as it is in node:
	this.global_objects["Date"] = new JScript_Date(this);
	this.register("Date", this.global_objects["Date"]);

        // ====
        // Math
        // ====
        this.global_objects["Math"] = new JScript_Math(this);
        this.register("Math", this.global_objects["Math"]);

	// =======
	// WScript
	// =======
        //
        // WScript also accepts additional options, such as script
        // arguments.
        let scriptargs = [];
        if (this.config.environment.hasOwnProperty("arguments")) {
            if (this.config.environment.arguments.unnamed) {
                scriptargs = scriptargs.concat(this.config.environment.arguments.unnamed);
            }

            if (this.config.environment.arguments.named) {
                let named = this.config.environment.arguments.named;
                Object.keys(named).forEach(key => scriptargs.push({ key: named[key] }));
            }
        }
        this.global_objects["WScript"] = new JScript_WScript(this, { arguments: scriptargs });
	this.register("WScript", this.global_objects["WScript"]);
    }

    _create_filesystem (filesystem) {

        const vfs  = this.global_objects["VirtualFileSystem"];

        if (filesystem.hasOwnProperty("folders")) {
            filesystem.folders.forEach(dir => {
                vfs.AddFolder(dir);
            });
        }

        if (filesystem.hasOwnProperty("files")) {
            Object.keys(filesystem.files).forEach(fp => {

                const value = filesystem.files[fp];

                // The value signals what kind of file to create.
                // There are three options:
                //
                //  1. If value is FALSE, this means create a blank
                //     file.
                //
                //  2. If value starts with an '@' symbol, it means
                //     "load the file from local disk".
                //
                //  3. If the file doesn't start with an '@' symbol,
                //     the string is the file contents.
                //
                var contents = "";
                if (typeof value === "string") {
                    if (value.startsWith("@")) {
                        let file_to_read = path.resolve(value.replace(/^@/, ""));
                        contents = fs.readFileSync(file_to_read).toString();
                    }
                    else {
                        contents = value;
                    }
                }

                vfs.AddFile(fp, contents);
            });
        }

        if (filesystem.hasOwnProperty("root") && filesystem.root.startsWith("@")) {

            const fakeroot = filesystem.root.replace(/^@/g, ""),
                  winpath  = require("path").win32;

            let walk = (host_dir, vm_dir) => {

                let items = fs.readdirSync(host_dir);

                items.forEach(item => {

                    let host_fs_path = path.resolve(path.join(host_dir, item)),
                        vm_fs_path   = winpath.join(vm_dir, item),
                        stat         = fs.statSync(host_fs_path);

                    if (stat.isDirectory()) {
                        vfs.AddFolder(vm_fs_path);
                        walk(host_fs_path, vm_fs_path);
                    }
                    else if (stat.isFile()) {
                        vfs.AddFile(vm_fs_path, fs.readFileSync(host_fs_path));
                    }
                });
            };

            walk(fakeroot, "C:");
        }
    }

    _create_registry (registry) {

        const vreg = this.global_objects["VirtualRegistry"],
              vfs  = this.global_objects["VirtualFileSystem"];

        Object.keys(registry).forEach(regpath => {

            if (regpath.startsWith("!")) {
                // A leading '!' means "create this folder.
                vfs.AddFolder(registry[regpath.replace(/^!/, "")]);
            }

            vreg.write(regpath.replace(/^!/, ""), registry[regpath]);
        });
    }


    get_hook (obj) {
        return this.hooks.match(obj);
    }


    get_nethook (req) {

        let nethook = this.nethooks.find(nh => {
            return nh.match_url(req.address);
        });

        if (!nethook) {
            nethook = this.default_nethook_response;
        }

        return nethook;
    }

    get_exechook (cmd) {

        let exechook = this.exechooks.find(eh => eh.matches(cmd));

        if (!exechook) {
            exechook = this.default_exechook;
        }

        return exechook;
    }


    get_vfs () {
	return this.vfs;
    }


    get_opt (name) {
	// TODO: Add code here which lets runtime code ask questions
	// of the Construct config.
    }

    get_cfg (cfg_item) {
        if (! this.CONFIG.hasOwnProperty(cfg_item)) return null;
        return this.CONFIG[cfg_item];
    }

    get_file_association (filename) {

        const extname = win32path
                  .extname(win32path.basename(filename))
                  .toLowerCase()
                  .replace(".", "");

        if (this.environment.fileassociations.hasOwnProperty(extname)) {
            return this.environment.FileAssociations[extname];
        }

        return `${extname} File`;
    }

    get_env (var_name) {

        if (var_name === "path") var_name = "cwd";

        if (! this.environment.hasOwnProperty(var_name)) return undefined;
        return this.environment[var_name];
    }

    set_env (key, value) {
        this.environment[key] = value;
    }

    skew_time_ahead_by (ms) {
	this.epoch += ms;
    }

    register (friendly_name, instance, parent) {
	if (parent === null || parent === undefined) parent = this;

	let component_register_entry = {
	    friendly_name: friendly_name,
	    instance:      instance,
	    parent:        parent._id
	};

	// Return the index of the registered component.
	return (this.component_register.push(component_register_entry) - 1);
    }

    add_instance (instance) {
        let existing = this.instances.some(ins => instance.__id__ === ins.__id__);

        if (!existing) {
            this.instances.push(instance);
        }
    }

    get_instance_by_id (id) {

        let instance = this.instances.find(ins => ins.__id__ === id);

        if (instance) {
            return instance;
        }
        else {
            return false;
        }
    }

    get_global_object(name) {
	return this.global_objects[name];
    }

    write_to_output_buf (...args) {
        this.output_buf.push(args.join(" "));
    }

    enable_event_tracking (instance) {

        let id;

        if (typeof id === "number" || typeof id === "string") {
            id = instance;
        }
        else {
            id = instance.__id__;
        }

        this._event_tracking[id] = true;
    }

    disable_event_tracking (instance) {

        let id;

        if (typeof instance === "number" || typeof instance === "string") {
            id = instance;
        }
        else {
            id = instance.__id__;
        }

        this._event_tracking[id] = false;
    }

    allow_event_tracking (instance) {

        let id;

        if (typeof id === "number" || typeof id === "string") {
            id = instance;
        }
        else if (instance.hasOwnProperty("name") && instance.hasOwnProperty("id")) {
            id = instance.id;
        }
        else {
            id = instance.__id__;
        }

        if (this._event_tracking.hasOwnProperty(id) === false) {
            return true; // always allow event tracking by default
        }
        else {
            return this._event_tracking[id];
        }
    }
}

module.exports = HostContext;
