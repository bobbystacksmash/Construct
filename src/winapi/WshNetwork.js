/*
 * https://msdn.microsoft.com/en-us/library/s6wt333f(v=vs.84).aspx
 *
 * Provides access to the shared resources on the network to which your
 * computer is connected.
 *
 * You create a WshNetwork object when you want to connect to network shares
 * and network printers, disconnect from network shares and network printers,
 * map or remove network shares, or access information about a user on the
 * network.
 *
 * [ WScript > WshNetwork ]
 *
 * PROPERTIES
 * ==========
 * [ ] ComputerName
 * [ ] UserDomain
 * [ ] UserName
 *
 * METHODS
 * =======
 * [ ] AddWindowsPrinterConnection https://msdn.microsoft.com/en-us/library/zsdh7hkb(v=vs.84).aspx
 * [ ] AddPrinterConnection
 * [ ] EnumNetworkDrives
 * [ ] EnumPrinterConnections
 * [ ] MapNetworkDrive
 * [ ] RemoveNetworkDrive
 * [ ] RemovePrinterConnection
 * [ ] SetDefaultPrinter
 *
 */

const Component = require("../Component"),
      proxify   = require("../proxify2");

class JS_WshNetwork extends Component {

    constructor (context) {
        super(context, "WshNetwork");
        this.context = context;
    }

    get computername () {
        // TODO
        return "COMPUTER_NAME";
    }

    get userdomain () {
        // TODO
        return "USER_DOMAIN";
    }

    get username () {
        // TODO
        return "USERNAME";
    }

    // Methods

    addwindowsprinterconnection () {
        // todo
    }

    AddPrinterConnection () {
        // todo
    }

    EnumNetworkDrives () {
        // todo
    }

    EnumPrinterConnections () {
        // todo
    }

    MapNetworkDrive () {
        // todo
    }

    RemoveNetworkDrive () {
        // todo
    }

    RemovePrinterConnection () {
        // todo
    }

    SetDefaultPrinter () {
        // todo
    }
}

module.exports = function create(context) {
    let wnet = new JS_WshNetwork(context);
    return proxify(context, wnet);
};
