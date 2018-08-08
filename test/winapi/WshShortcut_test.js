const assert            = require("chai").assert,
      WshShortcut       = require("../../src/winapi/WshShortcut"),
      make_context      = require("../testlib");

var ctx = null;

describe("WshShortcut", () => {

    beforeEach(function () {
        ctx = make_context();
    });

    describe("Construction", () => {

        it("should have a .toString() set to the LNK path when called", () => {
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");
            assert.equal(wsh.toString(), "C:\\foo.lnk");
        });

        it("should create a lnk in memory, but not persist it to disk", () => {
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");
            assert.equal(wsh.toString(), "C:\\foo.lnk");
            assert.isFalse(ctx.vfs.Exists("C:\\foo.lnk"));
        });

        it("should get the arguments from an existing LNK instance", () => {

            ctx.vfs.AddFile("C:\\foo.lnk", JSON.stringify({
                _arguments: "file args",
                _description: "file desc",
                _targetpath: "file target path"
            }));

            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");
            assert.equal(wsh.arguments, "file args");
            assert.equal(wsh.description, "file desc");
            assert.equal(wsh.fullname, "C:\\foo.lnk");
            assert.equal(wsh.targetpath, "file target path");
        });
    });

    describe(".Arguments", () => {

        it("should return an empty string when there are no arguments", () => {
            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.arguments, "");
        });

        it("should return the new value when setting the property", () => {

            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.arguments, "");
            const new_location = wsh.arguments = "foobarbaz";
            assert.equal(new_location, wsh.arguments);
        });

        it("should get and set arguments when no backing file is available", () => {

            assert.isFalse(ctx.vfs.Exists("C:\\foo.lnk"));
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");

            assert.equal(wsh.arguments, "");

            assert.doesNotThrow(() => wsh.arguments = "args...");
            assert.equal(wsh.arguments, "args...");

            assert.doesNotThrow(() => wsh.arguments = "new args!");
            assert.equal(wsh.arguments, "new args!");
        });
    });

    describe(".Description", () => {

        it("should return an empty string when there's no description", () => {
            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.description, "");
        });

        it("should return the new value when setting the property", () => {

            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.description, "");
            const new_location = wsh.description = "foobarbaz";
            assert.equal(new_location, wsh.description);
        });

        it("should get/set description when no backing file is available", () => {

            assert.isFalse(ctx.vfs.Exists("C:\\foo.lnk"));
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");

            assert.equal(wsh.description, "");

            assert.doesNotThrow(() => wsh.description = "desc...");
            assert.equal(wsh.description, "desc...");

            assert.doesNotThrow(() => wsh.description = "new desc!");
            assert.equal(wsh.description, "new desc!");
        });
    });

    describe(".FullName", () => {

        it("should return a full path to the shortcut file", () => {

            const path = "C:\\default.lnk",
                  wsh  = new WshShortcut(ctx, path);

            assert.equal(wsh.FullName, path);
        });

        it("should throw when trying to assign to '.FullName'", () => {

            ctx = make_context({
                exceptions: {
                    throw_wrong_argc_or_invalid_prop_assign: () => {
                        throw new Error("cannot assign to .fullname");
                    }
                }
            });

            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.throws(
                () => wsh.FullName = "C:\\foo.lnk", "cannot assign to .fullname"
            );
        });
    });

    describe(".HotKey", () => {

        it("should return an empty string when there are no arguments", () => {
            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.hotkey, "");
        });

        it("should return the new value when setting the property", () => {

            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.hotkey, "");
            const new_location = wsh.hotkey = "foobarbaz";
            assert.equal(new_location, wsh.hotkey);
        });

        it("should get and set arguments when no backing file is available", () => {

            assert.isFalse(ctx.vfs.Exists("C:\\foo.lnk"));
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");

            assert.equal(wsh.hotkey, "");

            assert.doesNotThrow(() => wsh.hotkey = "hotkey...");
            assert.equal(wsh.hotkey, "hotkey...");

            assert.doesNotThrow(() => wsh.hotkey = "new hotkey!");
            assert.equal(wsh.hotkey, "new hotkey!");
        });
    });


    describe(".IconLocation", () => {

        it("should return ',0' by default", () => {
            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.iconlocation, ",0");
        });

        it("should return the new value when setting the property", () => {

            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.iconlocation, ",0");
            const new_location = wsh.iconlocation = "foobarbaz";
            assert.equal(new_location, wsh.iconlocation);
        });

        it("should get/set iconlocation when no backing file is available", () => {

            assert.isFalse(ctx.vfs.Exists("C:\\foo.lnk"));
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");

            assert.equal(wsh.iconlocation, ",0");

            assert.doesNotThrow(() => wsh.iconlocation = "icon...");
            assert.equal(wsh.iconlocation, "icon...");

            assert.doesNotThrow(() => wsh.iconlocation = "new icon!");
            assert.equal(wsh.iconlocation, "new icon!");
        });
    });

    describe(".TargetPath", () => {

        it("should return an empty string when there are no arguments", () => {
            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.targetpath, "");
        });

        it("should return the new value when setting the property", () => {

            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.targetpath, "");
            const new_location = wsh.targetpath = "foobarbaz";
            assert.equal(new_location, wsh.targetpath);
        });

        it("should get/set targetpath when no backing file is available", () => {

            assert.isFalse(ctx.vfs.Exists("C:\\foo.lnk"));
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");

            assert.equal(wsh.targetpath, "");

            assert.doesNotThrow(() => wsh.targetpath = "icon...");
            assert.equal(wsh.targetpath, "icon...");

            assert.doesNotThrow(() => wsh.targetpath = "new icon!");
            assert.equal(wsh.targetpath, "new icon!");
        });
    });

    describe(".WindowStyle", () => {

        it("should return the default .WindowStyle for a new shortcut", () => {
            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.isNumber(wsh.windowstyle);
            assert.equal(wsh.windowstyle, 1);
        });

        it("should return the new value when setting the property", () => {
            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.windowstyle, 1);
            const new_location = wsh.windowstyle = 3;
            assert.equal(new_location, wsh.windowstyle);
        });

        it("should get/set .windowstyle when no backing file is available", () => {

            assert.isFalse(ctx.vfs.Exists("C:\\foo.lnk"));
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");

            assert.equal(wsh.windowstyle, 1);

            assert.doesNotThrow(() => wsh.windowstyle = 3);
            assert.equal(wsh.windowstyle, 3);

            assert.doesNotThrow(() => wsh.windowstyle = 7);
            assert.equal(wsh.windowstyle, 7);
        });

        it("should only allow numeric windowstyles", () => {

            ctx = make_context({
                exceptions: {
                    throw_type_mismatch: () => {
                        throw new Error("type mismatch");
                    }
                }
            });

            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");
            assert.equal(wsh.windowstyle, 1);

            assert.doesNotThrow(() => wsh.windowstyle = 2);
            assert.doesNotThrow(() => wsh.windowstyle = "9");
            assert.doesNotThrow(() => wsh.windowstyle = "-1");

            assert.throws(() => wsh.windowstyle = "yes", "type mismatch");
            assert.throws(() => wsh.windowstyle = [], "type mismatch");
        });

        /*it("should return numeric windowstyles even if the input is a str", () => {
            make_context();
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");
            assert.equal(wsh.windowstyle, 1);
            const result = wsh.windowstyle = "4";
        });*/
    });

    describe(".WorkingDirectory", () => {

        it("should return an empty string when there is no backing file", () => {
            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.workingdirectory, "");
        });

        it("should return the new value when setting the property", () => {

            const wsh = new WshShortcut(ctx, "C:\\default.lnk");
            assert.equal(wsh.workingdirectory, "");
            const new_location = wsh.workingdirectory = "foobarbaz";
            assert.equal(new_location, wsh.workingdirectory);
        });

        it("should get and set workingdir when no backing file is available", () => {

            assert.isFalse(ctx.vfs.Exists("C:\\foo.lnk"));
            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");

            assert.equal(wsh.workingdirectory, "");

            assert.doesNotThrow(() => wsh.workingdirectory = "workingdirectory...");
            assert.equal(wsh.workingdirectory, "workingdirectory...");

            assert.doesNotThrow(() => wsh.workingdirectory = "new workingdirectory!");
            assert.equal(wsh.workingdirectory, "new workingdirectory!");
        });
    });

    describe("#Save", () => {

        it("should save a blank LNK when no properties are set", () => {

            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");

            assert.isFalse(ctx.vfs.Exists("C:\\foo.lnk"));
            assert.doesNotThrow(() => wsh.save());
            assert.isTrue(ctx.vfs.Exists("C:\\foo.lnk"));

            assert.deepEqual(
                JSON.parse(ctx.vfs.ReadFileContents("C:\\foo.lnk").toString()),
                {
                    _arguments: "",
                    _description: "",
                    _fullname: "",
                    _hotkey: "",
                    _targetpath: "",
                    _iconlocation: ",0",
                    _windowstyle: 1,
                    _workingdirectory: ""
                }
            );
        });

        it("should write all properties to disk", () => {

            const wsh = new WshShortcut(ctx, "C:\\foo.lnk");

            assert.isFalse(ctx.vfs.Exists("C:\\foo.lnk"));
            assert.doesNotThrow(() => wsh.save());
            assert.isTrue(ctx.vfs.Exists("C:\\foo.lnk"));

            wsh.arguments        = "foo";
            wsh.description      = "bar";
            wsh.hotkey           = "test";
            wsh.targetpath       = "test";
            wsh.iconlocation     = "foobar";
            wsh.windowstyle      = 6,
            wsh.workingdirectory = "blah";

            wsh.save();

            const new_wsh = new WshShortcut(ctx, "C:\\foo.lnk");

            assert.equal(new_wsh.arguments, "foo");
            assert.equal(new_wsh.description, "bar");
            assert.equal(wsh.hotkey, "test");
            assert.equal(wsh.targetpath, "test");
            assert.equal(wsh.iconlocation, "foobar");
            assert.equal(wsh.windowstyle, 6);
            assert.equal(wsh.workingdirectory, "blah");
        });
    });
});
