
const Component = require("../Component");

class JS_ShellApplication extends Component {

    constructor (context) {
	super(context);
	this.ee = this.context.emitter;
    }

    //
    // PROPERTIES
    // ==========
    //
    get Application () {
	this.ee.emit("!ERROR::NOT_IMPLEMENTED", "ShellApplication.Application");
	return null;
    }


    get Parent () {
	this.ee.emit("@ShellApplication.Parent", arguments);
	return null;
    }


    //
    // METHODS
    // =======
    //

    // Adds a file to the most recently used (MRU) list.
    //  https://msdn.microsoft.com/en-us/library/windows/desktop/gg537735(v=vs.85).aspx
    AddToRecent (path_to_file, category) {
	// TODO
	// ====
	//   * If we ever support Vista (unlikely), treat `path_to_file==null' as a reset.
	//   * Currently `category' is not supported.
	this.ee.emit("@ShellApplication.AddToRecent", arguments);
	this.context.ENVIRONMENT.MRU.push(path_to_file);
    }


    BrowseForFolder () {
	this.ee.emit("!ERROR::NOT_IMPLEMENTED", "ShellApplication.BrowseForFolder");
	return true;
    }


    CanStartStopService (svc_name) {
	this.ee.emit("!ERROR::NOT_IMPLEMENTED", "ShellApplication.CanStartStopService");
	return true;
    }

    
    CascadeWindows () {
	this.ee.emit("@ShellApplication::CascadeWindows", arguments);
    }


    ControlPanelItem (cpi) {
	this.ee.emit("@ShellApplication::ControlPanelItem", arguments);
    }


    EjectPC () {
	this.ee.emit("@ShellApplication::EjectPC", arguments);
    }


    Explore () {
	this.ee.emit("@ShellApplication::Explore", arguments);
    }


    ExplorerPolicy (policy_name) {
	this.ee.emit("!ERROR::NOT_IMPLEMENTED", "ShellApplication.ExplorerPolicy");
    }


    FileRun () {
	this.ee.emit("@ShellApplication::FileRun", arguments);
    }


    FindComputer () {
	this.ee.emit("@ShellApplication::FindComputer", arguments);
    }


    FindFiles () {
	this.ee.emit("@ShellApplication::FindFiles", arguments);
    }


    FindPrinter (name, location, model) {
	this.ee.emit("@ShellApplication::FindPrinter", arguments);
    }
	

    GetSetting (setting) {
	// https://msdn.microsoft.com/en-us/library/windows/desktop/gg537739(v=vs.85).aspx
	this.ee.emit("!ERROR::NOT_IMPLEMENTED", "ShellApplication.GetSetting", arguments);
    }


    GetSystemInformation (system_info_name) {
	// https://msdn.microsoft.com/en-us/library/windows/desktop/gg537740(v=vs.85).aspx
	this.ee.emit("!ERROR::NOT_IMPLEMENTED", "ShellApplication.GetSystemInformation", arguments);
    }


    Help () {
	this.ee.emit("@ShellApplication::Help", arguments);
    }

    
    IsRestricted (group, restriction) {
	this.ee.emit("@ShellApplication::IsRestricted", arguments);
	return true;
    }


    IsServiceRunning (service_name) {

	this.ee.emit("@ShellApplication::IsServiceRunning", arguments);
	
	let service_index = this.context.ENVIRONMENT.Services.findIndex((s) => s === service_name);
	return (service_index > -1);
    }


    MinimizeAll () {
	this.ee.emit("@ShellApplication::MinimizeAll", arguments);
    }


    NameSpace (dir) {
	//https://msdn.microsoft.com/en-us/library/windows/desktop/bb774085(v=vs.85).aspx
	this.ee.emit("!ERROR::NOT_IMPLEMENTED", "ShellApplication.NameSpace", arguments);
    }

    
    Open (dir) {
	//https://msdn.microsoft.com/en-us/library/windows/desktop/bb774085(v=vs.85).aspx
	this.ee.emit("!ERROR::NOT_IMPLEMENTED", "ShellApplication.Open", arguments);
    }


    RefreshMenu () {
	this.ee.emit("@ShellApplication::RefreshMenu", arguments);
    }


    SearchCommand () {
	this.ee.emit("@ShellApplication::SearchCommand", arguments);
    }

    // MSDN: https://msdn.microsoft.com/en-us/library/windows/desktop/gg537743(v=vs.85).aspx
    //
    // Arguments
    // =========
    //   - service_name
    //     A String that contains the name of the service.
    //
    //   - make_persistent
    //     Set to true to have the service started automatically by the
    //     service control manager during system startup. Set to false
    //     to leave the service configuration unchanged.
    ServiceStart (service_name, make_persistent) {
	this.ee.emit("@ShellApplication::ServiceStart", arguments);
	return true; // Of course, your new service will always be created. ;-)
    }

    // MSDN: https://msdn.microsoft.com/en-us/library/windows/desktop/gg537744(v=vs.85).aspx
    //
    // Arguments
    // =========
    //   - service_name
    //   A String that contains the name of the service.
    //
    //   - make_persistent
    //     Set to true to have the service started by the service
    //     control manager when ServiceStart is called. To leave
    //     the service configuration unchanged, set 'make_persistent'
    //     to false.
    ServiceStop (service_name, make_persistent) {
	this.ee.emit("@ShellApplication::ServiceStop", arguments);
	return true;
    }


    SetTime () {
	this.ee.emit("@ShellApplication::SetTime", arguments);
    }


    // MSDN: https://msdn.microsoft.com/en-us/library/windows/desktop/gg537745(v=vs.85).aspx
    //
    // SYNOPSIS
    // ========
    //
    // This method is equivalent to launching one of the commands
    // associated with a file's shortcut menu. Each command is
    // represented by a verb string. The set of supported verbs varies
    // from file to file. The most commonly supported verb is "open",
    // which is also usually the default verb. Other verbs might be
    // supported by only certain types of files.
    //
    // Arguments
    // =========
    //
    //   - file
    //     A String that contains the name of the file on which
    //     ShellExecute will perform the action specified by
    //     `operation'.
    //
    //   - args      [optional]
    //     A string that contains parameter values for the operation.
    //
    //   - dir       [optional]
    //     The fully qualified path of the directory that contains
    //     the file specified by `file'.  If this parameter is not
    //     specified, the current working directory is used.
    //
    //   - operation [optional]
    //     The operation to be performed. This value is set to one
    //     of the verb strings that is supported by the file.  If
    //     this parameter is not specified, the default operation
    //     is performed.
    //
    //   - show      [optional]
    //
    //     A recommendation as to how the application window should be
    //     displayed initially. The application can ignore this
    //     recommendation. This parameter can be one of the following
    //     values. If this parameter is not specified, the application
    //     uses its default value.
    //
    // USAGE
    // =====
    //
    //   var objShell = new ActiveXObject("shell.application");
    //   objShell.ShellExecute("notepad.exe", "", "", "open", 1);
    //
    ShellExecute (file, args, dir, operation, show) {
	this.ee.emit("@ShellApplication::ShellExecute", arguments);
    }

    // MSDN: https://msdn.microsoft.com/en-us/library/windows/desktop/gg537746(v=vs.85).aspx
    //
    // SYNOPSIS
    // ========
    //
    // Displays a browser bar.
    //
    // ARGUMENTS
    // =========
    //
    //  - clsid
    //    A String that contains the string form of the CLSID of the
    //    browser bar to be displayed. The object must be registered
    //    as an Explorer Bar object with a CATID_InfoBand component
    //    category.
    //
    //  - show
    //    Set to true to show the browser bar or false to hide it.
    //
    // USAGE
    // =====
    //
    //  var objShell = new ActiveXObject("shell.application");
    //  objShell.ShowBrowserBar("{EFA24E61-B078-11d0-89E4-00C04FC9E26E}", true);
    //
    ShowBrowserBar () {
	this.ee.emit("@ShellApplication::ShowBrowserBar", arguments);
    }


    ShutdownWindows () {
	this.ee.emit("@ShellApplication::ShutdownWindows", arguments);
    }


    TileHorizontally () {
	this.ee.emit("@ShellApplication::TileHorizontally", arguments);
    }

    
    TileVertically () {
	this.ee.emit("@ShellApplication::TileVertically", arguments);
    }


    ToggleDesktop () {
	this.ee.emit("@ShellApplication::ToggleDesktop", arguments);
    }


    TrayProperties () {
	this.ee.emit("@ShellApplication::TrayProperties", arguments);
    }


    UndoMinimizeALL () {
	this.ee.emit("@ShellApplication::UndoMinimizeALL", arguments);
    }


    Windows () {
	this.ee.emit("!ERROR::NOT_IMPLEMENTED", "ShellApplication.Windows", arguments);
    }


    WindowsSecurity () {
	this.ee.emit("!ERROR::NOT_IMPLEMENTED", "ShellApplication.WindowsSecurity", arguments);
    }


    WindowSwitcher () {
	this.ee.emit("@ShellApplication::WindowSwitcher", arguments);	
    }
}


module.exports = function create(context) {
    let shell_application = new JS_ShellApplication(context);
    return shell_application;
};
