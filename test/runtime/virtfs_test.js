const assert = require("chai").assert;
const VirtualFileSystem = require("../../src/runtime/virtfs");

let any_date_will_do = new Date(1234567890);

let mock_date = {
    getTime: () => any_date_will_do.getTime()
};

let mock_context = {
    date: mock_date,
    register: () => {}
};

describe("VirtualFileSystem Module", function () { 

    xdescribe("Registration", () => {

	it("Should register itself.", (done) => {
	    new VirtualFileSystem({
		register: (name) => {
		    assert.equal(name, "VirtualFileSystem", "VFS registered!");
		    done();
		}
	    });
	});
    });

    xdescribe("Volumes", () => {

	it("Should be created with a volume: 'C:'.", (done) => {

	    let vfs = new VirtualFileSystem({
		register: () => {}
	    });

	    assert.equal(vfs.VolumeExists("C:"), true);
	    done();
	});

	it("Should allow volumes to be fetched.", (done) => {

	    let vfs = new VirtualFileSystem({ register: () => {} }),
		vol = vfs.GetVolume("C:");

	    assert.equal(vol.constructor.name, "FolderObject");
	    assert.equal(vol.Type, "File Folder");
	    done();
	});
    });

    describe("Files", () => {

	xdescribe("Adding", () => {

	    it("Should support adding a new file.", (done) => {

		let vfs  = new VirtualFileSystem({ register: () => {} }),
		    newf = vfs.AddFile("C:\\foo.txt", "And did those feet in ancient times...");

		assert.equal(newf.__contents, "And did those feet in ancient times...");
		assert.equal(newf.Name, "foo.txt");
		assert.equal(newf.constructor.name, "FileObject");
		done();
	    });
	});

	describe("Copying", () => {

	    it("Should support copying a file.", (done) => {

		let src_path = "C:\\foo\\bar\\baz\\test.txt",
		    dst_path = "C:\\destination\\filedir";
		
		let vfs = new VirtualFileSystem({ register: () => {} }),
		    src = vfs.AddFile(src_path, "Bring me my bow of burning gold."),
		    dst_dir = vfs.AddFolder(dst_path);

		let copied_file = vfs.CopyFileToFolder(src_path, dst_path);

		assert.equal(copied_file.constructor.name, "FileObject");
		assert.equal(src.Name, copied_file.Name);
		assert.equal(copied_file.Path, "c:\\destination\\filedir\\test.txt");

		done();
		    
		
	    });
	});
    });
    
    xdescribe("Folders", () => {

	describe("Adding", () => {

	    it("Should support adding a new folder.", (done) => {

		let vfs = new VirtualFileSystem({ register: () => {} }),
		    fld = vfs.AddFolder("C:\\foo\\bar\\baz");

		assert.equal(fld.Type, "File Folder");
		assert.equal(fld.Name, "baz");
		
		assert.equal(fld.ParentFolder.Type, "File Folder");
		assert.equal(fld.ParentFolder.Name, "bar");

		assert.equal(fld.ParentFolder.ParentFolder.Type, "File Folder");
		assert.equal(fld.ParentFolder.ParentFolder.Name, "foo");

		assert.equal(
		    fld.ParentFolder.ParentFolder.ParentFolder.IsRootFolder, true
		);

		assert.equal(fld.constructor.name, "FolderObject");
		
		done();
	    });
	});
    });

});
