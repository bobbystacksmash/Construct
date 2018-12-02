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
          data     = await analyser.analyse(fp, { reporter: "dumpexec" });

    return data;
}

describe("Dumpexec reporter", () => {

    // Captures events where code 'shells out'.

    describe("WshShell", () => {

        it("should capture WshShell.run()", async () => {

            let data = await init_and_get_results(`
              (WScript.CreateObject("WScript.Shell")).run("calc.exe");
            `);

            expect(data).to.be.an("array");
            expect(data).to.have.lengthOf(1);
            expect(data[0]).to.equal("calc.exe");
        });

        it("should capture WshShell.exec()", async () => {
            let data = await init_and_get_results(`
              (WScript.CreateObject("WScript.Shell")).exec("notepad.exe");
            `);

            expect(data).to.be.an("array");
            expect(data).to.have.lengthOf(1);
            expect(data[0]).to.equal("notepad.exe");
        });
    });

    describe("ShellApplication", () => {

        it("should capture ShellApplication.ShellExecute()", async () => {

            let data = await init_and_get_results(`
              (WScript.CreateObject("Shell.Application")).shellexecute("cmd /c notepad.exe");
            `);

            expect(data).to.be.an("array");
            expect(data).to.have.lengthOf(1);
            expect(data[0]).to.equal("cmd /c notepad.exe");
        });
    });
});
