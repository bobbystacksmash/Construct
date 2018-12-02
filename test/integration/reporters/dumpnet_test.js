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
          data     = await analyser.analyse(fp, { reporter: "dumpnet" });

    return data;
}

describe("Dumpnet reporter", () => {

    it("xx.", async () => {

        let data = await init_and_get_results(`
          var xhr = new ActiveXObject("MSXML2.XMLHTTP");
          xhr.open("GET", "github.com");
        `);

        expect(data).to.be.an("array");
        expect(data).to.have.lengthOf(1);

        expect(data[0]).to.deep.equal({ "GET": "github.com" });
    });

});
