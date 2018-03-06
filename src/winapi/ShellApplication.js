

/*
 * https://msdn.microsoft.com/en-us/library/windows/desktop/bb774094(v=vs.85).aspx
 *
 *
 * METHODS
 * =======
 *
 * [ ] AddToRecent          https://msdn.microsoft.com/en-us/library/windows/desktop/gg537735(v=vs.85).aspx
 * [ ] BrowseForFolder      https://msdn.microsoft.com/en-us/library/windows/desktop/bb774065(v=vs.85).aspx
 * [ ] CanStartStopService  https://msdn.microsoft.com/en-us/library/windows/desktop/gg537736(v=vs.85).aspx
 * [ ] CascadeWindows       https://msdn.microsoft.com/en-us/library/windows/desktop/bb774067(v=vs.85).aspx
 * [ ] ControlPanelItem     https://msdn.microsoft.com/en-us/library/windows/desktop/bb774069(v=vs.85).aspx
 * [ ] EjectPC              https://msdn.microsoft.com/en-us/library/windows/desktop/bb774071(v=vs.85).aspx
 * [ ] Explore              https://msdn.microsoft.com/en-us/library/windows/desktop/bb774073(v=vs.85).aspx
 * [ ] ExplorerPolicy       https://msdn.microsoft.com/en-us/library/windows/desktop/gg537737(v=vs.85).aspx
 * [ ] FileRun              https://msdn.microsoft.com/en-us/library/windows/desktop/bb774075(v=vs.85).aspx
 * [ ] FindComputer         https://msdn.microsoft.com/en-us/library/windows/desktop/bb774077(v=vs.85).aspx
 * [ ] FindFiles            https://msdn.microsoft.com/en-us/library/windows/desktop/bb774079(v=vs.85).aspx
 * [ ] FindPrinter          https://msdn.microsoft.com/en-us/library/windows/desktop/gg537738(v=vs.85).aspx
 * [ ] GetSetting           https://msdn.microsoft.com/en-us/library/windows/desktop/gg537739(v=vs.85).aspx
 * [ ] GetSystemInformation https://msdn.microsoft.com/en-us/library/windows/desktop/gg537740(v=vs.85).aspx
 * [ ] Help                 https://msdn.microsoft.com/en-us/library/windows/desktop/bb776786(v=vs.85).aspx
 * [ ] IsRestricted         https://msdn.microsoft.com/en-us/library/windows/desktop/gg537741(v=vs.85).aspx
 * [ ] IsServiceRunning     https://msdn.microsoft.com/en-us/library/windows/desktop/gg537742(v=vs.85).aspx
 * [ ] MinimiseAll          https://msdn.microsoft.com/en-us/library/windows/desktop/bb774083(v=vs.85).aspx
 * [ ] NameSpace            https://msdn.microsoft.com/en-us/library/windows/desktop/bb774085(v=vs.85).aspx
 * [ ] Open                 https://msdn.microsoft.com/en-us/library/windows/desktop/bb774086(v=vs.85).aspx
 * [ ] RefreshMenu          https://msdn.microsoft.com/en-us/library/windows/desktop/bb774090(v=vs.85).aspx
 * [ ] SearchCommand        https://msdn.microsoft.com/en-us/library/windows/desktop/jj635751(v=vs.85).aspx
 * [ ] ServiceStart         https://msdn.microsoft.com/en-us/library/windows/desktop/gg537743(v=vs.85).aspx
 * [ ] ServiceStop          https://msdn.microsoft.com/en-us/library/windows/desktop/gg537744(v=vs.85).aspx
 * [ ] SetTime              https://msdn.microsoft.com/en-us/library/windows/desktop/bb774092(v=vs.85).aspx
 * [ ] ShellExecute         https://msdn.microsoft.com/en-us/library/windows/desktop/gg537745(v=vs.85).aspx
 * [ ] ShowBrowserBar       https://msdn.microsoft.com/en-us/library/windows/desktop/gg537746(v=vs.85).aspx
 * [ ] ShutDownWindows      https://msdn.microsoft.com/en-us/library/windows/desktop/bb774098(v=vs.85).aspx
 * [ ] Suspend              https://msdn.microsoft.com/en-us/library/windows/desktop/bb774100(v=vs.85).aspx
 * [ ] TileHorizontally     https://msdn.microsoft.com/en-us/library/windows/desktop/bb774102(v=vs.85).aspx
 * [ ] TileVertically       https://msdn.microsoft.com/en-us/library/windows/desktop/bb774104(v=vs.85).aspx
 * [ ] ToggleDesktop        https://msdn.microsoft.com/en-us/library/windows/desktop/gg537747(v=vs.85).aspx
 * [ ] TrayProperties       https://msdn.microsoft.com/en-us/library/windows/desktop/bb774105(v=vs.85).aspx
 * [ ] UndoMinimizeAll      https://msdn.microsoft.com/en-us/library/windows/desktop/bb774106(v=vs.85).aspx
 * [ ] Windows              https://msdn.microsoft.com/en-us/library/windows/desktop/bb774107(v=vs.85).aspx
 * [ ] WindowsSecurity      https://msdn.microsoft.com/en-us/library/windows/desktop/gg537748(v=vs.85).aspx
 * [ ] WindowSwitcher       https://msdn.microsoft.com/en-us/library/windows/desktop/gg537749(v=vs.85).aspx
 *
 * PROPERTIES
 * ==========
 *
 * [ ] Application https://msdn.microsoft.com/en-us/library/windows/desktop/bb774063(v=vs.85).aspx
 * [ ] Parent      https://msdn.microsoft.com/en-us/library/windows/desktop/bb774089(v=vs.85).aspx
 *
 */

class ShellApplication extends Component {

    constructor (context) {
	super(context);
	this.ee = this.context.emitter;
    }


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
	this.ee.emit("!ERROR::NOT_IMPLEMENTED" "ShellApplication.BrowseForFolder");
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
	this.ee.emit("!ERROR::NOT_IMPLEMENTED", "ShellApplication.GetSetting");
    }


    GetSystemInformation (system_info_name) {
	// https://msdn.microsoft.com/en-us/library/windows/desktop/gg537740(v=vs.85).aspx
	this.ee.emit("!ERROR::NOT_IMPLEMENTED", "ShellApplication.GetSystemInformation");
    }
	
	
    
}




/*
module.exports = function ShellApplication (opts) {

    let ee = opts.emitter;

    function ShellExecute (file, params, dir, operation, show) {
        ee.emit(events.WINAPI.ShellApplication.ShellExecute, {
            file: file,
            args: params,
            dir: dir,
            operation: operation,
            show: show
        });
    }

    let ShellApplication = { 
        ShellExecute: ShellExecute
    };

    return proxify2(ShellApplication, "ShellApplication", opts);
}
*/
