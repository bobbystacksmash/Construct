const assert = require("chai").assert;
const FileSystemObject = require("../../src/winapi/FileSystemObject");

describe("Win API: Scripting.FileSystemObject (FSO)", () => {

    describe("Methods", () => {

	describe("#Add", () => {

	    it("Should export method `Add'.", (done) => {
		let fso = new FileSystemObject();
		assert.equal(typeof fso.Add, "function");
		done();
	    });
	});
    });
});
