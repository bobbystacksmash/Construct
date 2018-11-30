//    INTEGRATION TEST
// Tests the Construct API

const expect         = require("chai").expect,
      temp           = require("temp"),
      fs             = require("fs"),
      path           = require("path"),
      Construct      = require("../../index");

TEST_CONFIG_FILE = "./test/integration/construct.cfg";

temp.track();
function mktmp (code) {

    let info = temp.openSync("tempjs");
    fs.writeSync(info.fd, code);
    fs.closeSync(info.fd);
    return info.path;
}

describe("Construct", () => {

    describe("Public API", () => {

        it("should resolve a promise with the event output", async () => {

            let fp = mktmp("WScript.Echo('hello');");
            const analyser = new Construct({ config: TEST_CONFIG_FILE });
            const data = await analyser.analyse(fp);

            expect(data).to.be.a("array");
            expect(data).to.have.lengthOf(1);
            expect(data[0]).to.have.all.keys(
                "args",
                "meta",
                "property",
                "retval",
                "target",
                "type"
            );

            expect(data[0].target).to.have.all.keys("name", "id");

            expect(data[0].args).to.deep.equal([{
                type: "string",
                value: "hello"
            }]);
        });

        it("should be able to load a file, and that file read itself", async () => {

            // Bit weird, but we need a way to get the configured username.
            const whoami = (new Construct({ config: TEST_CONFIG_FILE })).config.general.whoami;

            let info = temp.openSync("tempjs");

            let code = [
                "// %HELLO_WORLD%",
                "var fso = new ActiveXObject('Scripting.FileSystemObject');",
                `var ts  = fso.OpenTextFile("C:\\\\Users\\\\${whoami}\\\\${path.basename(info.path)}");`,
                `ts.ReadAll();`
            ].join("\n");

            fs.writeSync(info.fd, code);

            const analyser = new Construct({ config: TEST_CONFIG_FILE });
            const data = await analyser.analyse(info.path);
            expect(data.pop().retval).to.equal(code);
            fs.closeSync(info.fd);
        });

        it("should load arguments from the configuration file and expose them via WShell.Arguments", async () => {

            // As configured, arg[0] = "baz".
            let fp = mktmp("WScript.Arguments(0)");

            const analyser = new Construct({ config: TEST_CONFIG_FILE }),
                  data     = await analyser.analyse(fp);

            expect(data.pop().retval).to.equal("baz");
        });
    });

    describe("JScript oddities", () => {

        describe("WScript", () => {

            it("should return a callable environment/system args fn", async () => {

                let fp = mktmp(`
                  var a = WScript.CreateObject("WScript.Shell");
                  var b = a["ENVIRONMENT"]("SYSTEM");
                  var c = b("ComSpec");
                `);

                const analyser = new Construct({ config: TEST_CONFIG_FILE }),
                      data     = await analyser.analyse(fp);
            });
        });
    });
});
