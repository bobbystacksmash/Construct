//    INTEGRATION TEST
// Tests the Construct API

const expect         = require("chai").expect,
      temp           = require("temp"),
      fs             = require("fs"),
      path           = require("path"),
      Construct      = require("../../index");

temp.track();
function mktmp (code) {

    let info = temp.openSync("tempjs");
    fs.writeSync(info.fd, code);
    fs.closeSync(info.fd);
    return info.path;
}

describe("#Construct public API", () => {

    describe("Loading a JScript program", () => {

        it("should resolve a promise with the event output", async () => {

            let fp = mktmp("WScript.Echo('hello');");
            const analyser = new Construct({ config: "./construct.cfg" });
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
            const whoami = (new Construct({ config: "./construct.cfg" })).config.general.whoami;

            let info = temp.openSync("tempjs");

            let code = [
                "// %HELLO_WORLD%",
                "var fso = new ActiveXObject('Scripting.FileSystemObject');",
                `var ts  = fso.OpenTextFile("C:\\\\Users\\\\${whoami}\\\\${path.basename(info.path)}");`,
                `ts.ReadAll();`
            ].join("\n");

            fs.writeSync(info.fd, code);

            const analyser = new Construct({ config: "./construct.cfg" });
            const data = await analyser.analyse(info.path);
            expect(data.pop().retval).to.equal(code);
            fs.closeSync(info.fd);
        });
    });
});
