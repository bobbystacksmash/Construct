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

let init_and_get_results = async function (code, include_header) {

    if (include_header === undefined) {
        include_header = false;
    }

    let fp = mktmp(code);
    const analyser = new Construct({ config: TEST_CONFIG_FILE }),
          data     = await analyser.analyse(fp, { reporter: "dumpnet" });

    if (include_header) {
        return data;
    }
    else {
        return data.body;
    }
}

describe("Dumpnet reporter", () => {

    it("should capture HTTP GET requests via XHR", async () => {

        let data = await init_and_get_results(`
          var xhr = new ActiveXObject("MSXML2.XMLHTTP");
          xhr.open("GET", "github.com");
        `);

        expect(data).to.be.an("array");
        expect(data).to.have.lengthOf(1);

        expect(data[0]).to.deep.equal({ "GET": "github.com" });
    });
});
