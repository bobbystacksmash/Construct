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

    describe("Registration", () => {

	it("Should register itself.", (done) => {
	    new VirtualFileSystem({
		register: (name) => {
		    assert.equal(name, "VirtualFileSystem", "VFS registered!");
		    done();
		}
	    });
	});
    });

    describe("Volumes", () => {

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

	describe("Adding", () => {

	    it("Should support adding a new file.", (done) => {

		let vfs  = new VirtualFileSystem({ register: () => {} }),
		    newf = vfs.AddFile("C:\\foo.txt", "And did those feet in ancient times...");

		assert.equal(newf.__contents, "And did those feet in ancient times...");
		assert.equal(newf.Name, "foo.txt");
		assert.equal(newf.constructor.name, "FileObject");
		done();
	    });
	});

	describe("Deleting", () => {

	    it("Should support file deletion.", (done) => {
		
		let vfs  = new VirtualFileSystem({ register: () => {} });
		var file = vfs.AddFile("C:\\a.txt", "Bring me my bow of burning gold.");
		assert.equal(file.Name,  "a.txt");

		var success = vfs.DeleteFile("C:\\a.txt");

		assert.equal(success, true);

		var no_file_here = vfs.GetFile("C:\\a.txt");
		assert.equal(no_file_here, false);
		
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

	    it("Should overwrite an existing file if configured.", (done) => {

		let vfs = new VirtualFileSystem({ register: () => {} }),

		    // Copy this...
		    fl1 = vfs.AddFile("C:\\foo\\bar.txt",
				      "Walk upon England's mountains green..."),

		    // And overwrite this:
		    fl2 = vfs.AddFile("C:\\baz\\bar.txt",
				      "...among those dark satanic mills?"),
		    
		    res = vfs.CopyFileToFolder("C:\\foo\\bar.txt",
					       "C:\\baz",
					       { overwrite: true });

		assert.equal(res.contents, "Walk upon England's mountains green...");
		assert.equal(res.ParentFolder.Path, "c:\\baz");

		done();
	    });

	    it("Should fail when trying to overwrite an existing file.", (done) => {

		let vfs = new VirtualFileSystem({ register: () => {} }),
		    fl1 = vfs.AddFile("C:\\foo\\bar.txt"),
		    fl2 = vfs.AddFile("C:\\baz\\bar.txt"),
		    res = vfs.CopyFileToFolder("C:\\foo\\bar.txt",
					       "C:\\baz",
					       { overwrite: false });

		assert.equal(res, false);
		done();
	    });
	});
    });
    
    describe("Folders", () => {

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
