module.exports = {

    DEBUG: {
        error           : "DEBUG.error",
        property_access : "property_access",
    },

    WINAPI: {
        generic: {
            new:  "WINAPI.generic.new",
            call: "WINAPI.generic.call",
            property: {
                set: "WINAPI.generic.property.set",
                get: "WINAPI.generic.property.get",
            }
        },
        WScript: {
            WshShell: {
                SpecialFolders: {
                    get: "WINAPI.WScript.WshShell.SpecialFolders.get"
                }
            }
        }
    }
};
