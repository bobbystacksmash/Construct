const expect         = require("chai").expect,
      temp           = require("temp"),
      fs             = require("fs"),
      path           = require("path"),
      Construct      = require("../../../index");

TEST_CONFIG_FILE = "./test/integration/construct.cfg";

temp.track();
function mktmp (code) {
    let info = temp.openSync("tempjs");
    fs.writeSync(info.fd, code);
    fs.closeSync(info.fd);
    return info.path;
}

let init_and_get_results = async function (code) {
    let fp = mktmp(code);
    const analyser = new Construct({ config: TEST_CONFIG_FILE }),
          data     = await analyser.analyse(fp, { reporter: "deobfuscate" });

    return data;
}

describe("Deobfuscate reporter", () => {

    // Attempts to convert captured Construct events back in to code.
    // Returns a JSON array where each element is a line of generated
    // code.

    it("should correctly re-assemble WScript.Echo events.", async () => {

        let data = await init_and_get_results(`WScript.Echo('hello');`);

        expect(data).to.be.an("array");
        expect(data).to.have.lengthOf(1);
        expect(data[0]).to.equal(`WScript.Echo('hello');`);
    });

    it("should create a variable where an instance is returned", async () => {

        let data = await init_and_get_results(`var x = WScript.CreateObject("ADODB.Stream");`);

        expect(data).to.be.an("array");
        expect(data).to.have.lengthOf(1);

        expect(data[0]).to.equal(`var adodbstream_14 = WScript.CreateObject('ADODB.Stream');`);
    });

    it("should re-use the same var name when dealing with events from the same target", async () => {

        let data = await init_and_get_results(`
          var x = WScript.CreateObject("ADODB.Stream");
          x.type = 2;
        `);

        expect(data).to.be.an("array");
        expect(data).to.have.lengthOf(2);

        expect(data).to.deep.equal([
            `var adodbstream_14 = WScript.CreateObject('ADODB.Stream');`,
            `adodbstream_14.type = 2;`
        ]);
    });

    it("should handle odd JScript function/object types", async () => {

        let data = await init_and_get_results(`
          var a = WScript.CreateObject("WScript.Shell");
          var b = a.ENVIRONMENT("SYSTEM")("ComSpec");
        `);

        expect(data).to.be.an("array");
        expect(data).to.have.lengthOf(3);
        expect(data).to.deep.equal([
            `var wshshell_14 = WScript.CreateObject('WScript.Shell');`,
            `var wshenvironment_15 = WshEnvironment.ENVIRONMENT('SYSTEM');`,
            `wshenvironment_15.item('ComSpec'); // => C:\\Windows\\System32\\cmd.exe`
        ]);
    });

    it("should not emit any events associated with Math", async () => {
        let data = await init_and_get_results(`var x = Math.ceil(3.14);`);

        expect(data).to.be.an("array");
        expect(data).to.have.lengthOf(1);
        expect(data[0]).to.equal(`Math.ceil(3.14); // => 4`);
    });
});
