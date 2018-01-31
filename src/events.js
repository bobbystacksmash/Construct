const EventEmitter2  = require("eventemitter2").EventEmitter2;

const EVENTS = {

    "$DEBUG::property-exists": {},
    "$DEBUG::property-missing": {},
    "$DEBUG::constructed": {},
    "$DEBUG::component-registered": {},

    "!ERROR::UNKNOWN_EVENT": {},
    "!ERROR::NOT_IMPLEMENTED": {},

    "@FileSystemObject::GetFolder": {},
   
    
    "@Date::new": {},
    "@Date::getDate": {},
    "@Date::getMonth": {},
    "@Date::getYear": {},
    "@Date::getHours": {},
    "@Date::getMinutes": {},
    "@Date::getSeconds": {},

    "@ADODB::Stream::new": {},
    "@ADODB::Stream::Open": {},
    "@ADODB::Stream::Write": {},
    "@ADODB::Stream::SaveToFile": {},
    "@ADODB::Stream::Close": {},

    "@ActiveXObject::new::Shell.Application": {},
    "@ActiveXObject::new::WScript.Shell": {},
    "@ActiveXObject::new::Scripting.FileSystemObject": {},
    "@ActiveXObject::new::MSXML2.ServerXMLHttp": {},
    "@ActiveXObject::new::MSXML2.XMLHttp": {},
    "@ActiveXObject::new::ADODB.Stream": {},

    "@ShellApplication::new": {},
    "@ShellApplication::ShellExecute": {},

    "@WScript::new": {},
    "@WScript::Sleep": {},
    "@WScript::Echo": {},
    "@WScript::CreateObject::MSXML2.ServerXMLHttp": {},

    "@WScript::WshNetwork::new": {},
    "@WScript::WshNetwork::AddWindowsPrinterConnection": {},

    "@WScript::WshShell::new": {},
    "@WScript::WshShell::SpecialFolders": {},

    "@XMLHttpRequest::new": {},
    "@XMLHttpRequest::Open": {},
    "@XMLHttpRequest::Send": {},
};

        

function Eventer (opts) {
    this.emitter = new EventEmitter2({ wildcard: true });
    return this;
}

Eventer.prototype.emit = function (event, eobj) {

    eobj = eobj || {};

    if (!EVENTS.hasOwnProperty(event)) {

        let failed_event_emit_info = {
            help: "foo",
            url: null,
            orig_event: event
        };
        
        this.emitter.emit(EVENTS["!ERROR::UNKNOWN_EVENT"], failed_emit_info);
        return;
    }

    this.emitter.emit(event, EVENTS[event], eobj);
}


Eventer.prototype.on = function (...args) {
    this.emitter.on(...args);
};











var events = {
    DEBUG: {
        error            : "DEBUG.error",
        constructed: "DEBUG.constructed",
        property: {
            missing: "DEBUG.property.missing",
            exists:  "DEBUG.property.exists"
        }
    },

    Report: {
        coverage: "Report.coverage",
    },

    Date: {
        new: "Date.new",
        getDate: "Date.getDate",
        getMonth: "Date.getMonth",
        getYear: "Date.getYear",
        getHours: "Date.getHours",
        getMinutes: "Date.getMinutes",
        getSeconds: "Date.getSeconds",
        getTime:    "Date.Time",
    },

    eval: "eval",

    WINAPI: {
        generic: {
            new:  "WINAPI.generic.new",
            call: "WINAPI.generic.call",
            property: {
                set: "WINAPI.generic.property.set",
                get: "WINAPI.generic.property.get",
            }
        },
        ADODB: {
            Stream: {
                new: "WINAPI.ADODB.new",
                Open: "WINAPI.ADODB.Open",
                Write: "WINAPI.ADODB.Write",
                SaveToFile: "WINAPI.ADODB.SaveToFile",
                Close: "WINAPI.ADODB.Close",
            },

            _new: {
                e: "WINAPI.ADODB.new",
                desc: "Represents a stream of binary data or text.",
                url:  "https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/stream-object-ado"
            },
            _Open: {
                e: "WINAPI.ADODB.Open",
                desc: "Opens a Stream object to manipulate streams of binary or text data.",
                url: "https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/open-method-ado-stream",
            },
            _Write: {
                e: "WINAPI.ADODB.Write",
                desc: "Writes binary data to a Stream object.",
                url: "https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/write-method",
            },
            _SaveToFile: {
                e: "WINAPI.ADODB.SaveToFile",
                desc: "Saves the binary contents of a stream to a file.",
                url: "https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/savetofile-method",
            },
        },
        ActiveXObject: {
            new: {
                Shell: {
                    Application: "WINAPI.ActiveXObject.new.Shell.Application",
                },
                WScript: {
                    Shell: "WINAPI.ActiveXObject.new.WScript.Shell",
                },
                Scripting: {
                    FileSystemObject: "WINAPI.ActiveXObject.new.Scripting.FileSystemObject",
                },
                MSXML2: {
                    ServerXMLHttp: "WINAPI.ActiveXObject.new.MSXML2.ServerXMLHttp",
                    XMLHttp: "WINAPI.ActiveXObject.new.MSXML2.XMLHttp",
                },
                ADODB: {
                    Stream: "WINAPI.ActiveXObject.new.ADODB.Stream"
                }
            }
        },
        ShellApplication: {
            new: "WINAPI.ShellApplication.new",
            ShellExecute: "WINAPI.ShellApplication.ShellExecute",
        },
        WScript: {
            Sleep: "WINAPI.WScript.Sleep",
            Echo: "WINAPI.WScript.Echo",
            WshNetwork: {
                AddWindowsPrinterConnection: {
                    e: "WINAPI.WScript.WshNetwork.AddWindowsPrinterConnection",
                    desc: "Adds a Windows-based printer connection to your computer system.",
                    url:  "https://msdn.microsoft.com/en-us/library/zsdh7hkb(v=vs.84).aspx"
                },
            },
            WshShell: {
                new: {
                    e:    "WINAPI.WScript.WshShell",
                    desc: "Wscript.WshShell provides access to the native Windows shell.",
                    url:  "https://msdn.microsoft.com/en-us/subscriptions/aew9yb99(v=vs.84).aspx"
                },
                SpecialFolders: {
                    get: "WINAPI.WScript.WshShell.SpecialFolders.get",
                    get_help: `WshSpecialFolders is a collection of Windows special folders, such as the Desktop, Start Menu, and Personal Document folder.`,
                    get_url: "https://msdn.microsoft.com/en-us/subscriptions/0ea7b5xe(v=vs.84).aspx"
                }
            }
        },
        XMLHttpRequest: {
            new: "WINAPI.XMLHttpRequest.new",
            open: "WINAPI.XMLHttpRequest.open",
            send: "WINAPI.XMLHttpRequest.send",

            _new: {
                e:    "WINAPI.XMLHttpRequest.new",
                desc: "Allows data transfer between a client and a remote web server.",
                url:  "https://msdn.microsoft.com/en-us/library/ms757849(v=vs.85).aspx",
            },
            _open: {
                e:    "WINAPI.XMLHttpRequest.open",
                desc: "Initializes a request and specifies the method, URL, and authentication information.",
                url:  "https://msdn.microsoft.com/en-us/library/ms757849",
            },
        },

    },
}



module.exports = Eventer;
