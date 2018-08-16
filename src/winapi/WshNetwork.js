/* PROPERTIES
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

const Component        = require("../Component");
const proxify          = require("../proxify2");

class WshNetwork extends Component {

    constructor (context) {
        super(context, "WshNetwork");
    }

    get computername () {
        return this.context.config.computername;
    }

    get userdomain () {
        return this.context.config.user.domain;
    }

    get username () {
        return this.context.config.user.name;
    }

    addwindowsprinterconnection (lname, rname, update_profile, user, pass) {

    }

    addprinterconnection (path_to_printer) {

    }

    enumnetworkdrives () {

    }

    enumprinterconnections () {

    }

    mapnetworkdrive () {

    }

    removenetworkdrive () {

    }

    removeprinterconnection () {

    }

    setdefaultprinter () {

    }
}

module.exports = function create(context) {
    let wshnet = new JS_WshNetwork(context);
    return proxify(context, wshnet);
};
