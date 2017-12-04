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

const winevts           = require("../events");
const Proxify           = require("../proxify");

var ee;

function mock_MISSING_METHOD (name) {
    let msg = `[WshNetwork.${name}] - METHOD NOT YET IMPLEMENTED.`;
    alert(msg)
    console.log(msg);
}


/*
 * ======================================
 * WshNetwork.AddWindowsPrinterConnection
 * ======================================
 *
 * https://msdn.microsoft.com/en-us/library/zsdh7hkb(v=vs.84).aspx
 *
 * Using this method is similar to using the Printer option on Control Panel to
 * add a printer connection. Unlike the AddPrinterConnection method, this method
 * allows you to create a printer connection without directing it to a specific
 * port, such as LPT1. If the connection fails, an error is thrown. In Windows
 * 9x/Me, the printer driver must already be installed on the machine for the
 * AddWindowsPrinterConnection method to work. If the driver is not installed,
 * Windows returns an error message.
 *
 */
function mock_AddWindowsPrinterconnection (strPrinterPath, strDriverName, strPort) {

    ee.winapi(winevts.WINAPI.WScript.WshNetwork.AddWindowsPrinterConnection, {
        args: {
            strPrinterPath: strPrinterPath,
            strDriverName:  strDriverName
        }
    });

    // TODO...
}


function create(opts) {

    ee = opts.emitter || { emit: () => {}, on: () => {} };

    let mock_WshNetwork_API = {
    };

    let overrides = {
        get: (target, key) => {
            return mock_WshNetwork_API[key]
        }
    };

    var proxify = new Proxify({ emitter: ee });
    return proxify(mock_WshNetwork_API, overrides, "WshNetwork");
}

module.exports = create;
