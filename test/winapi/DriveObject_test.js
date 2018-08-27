const assert            = require("chai").assert;
const Drive            = require("../../src/winapi/DriveObject");
const VirtualFileSystem = require("../../src/runtime/virtfs");
const make_ctx          = require("../testlib");

describe("DriveObject", () => {



    describe(".AvailableSpace", () => {
        it("should return freespace as an integer", () => {
            const dr = new Drive(make_ctx());
            assert.isNumber(dr.AvailableSpace);
        });

        it("should throw if property is assigned to", () => {
            const d = new Drive(make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("property is ready only");
                    }
                }
            }));

            assert.throws(() => d.VolumeName = "a");
        });
    });

    describe(".DriveLetter", () => {
        it("should return 'C'", () => {
            assert.equal(new Drive(make_ctx()).driveletter, "C");
        });

        it("should throw if property is assigned to", () => {
            const d = new Drive(make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("property is ready only");
                    }
                }
            }));

            assert.throws(() => d.driveletter = "a");
        });
    });

    describe(".DriveType", () => {
        it("should return 2 (Fixed)", () => {
            assert.equal(new Drive(make_ctx()).drivetype, 2);
        });

        it("should throw if property is assigned to", () => {
            const d = new Drive(make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("property is ready only");
                    }
                }
            }));

            assert.throws(() => d.drivetype = "dt");
        });
    });

    describe(".FileSystem", () => {
        it("should return 'NTFS'", () => {
            assert.equal(new Drive(make_ctx()).filesystem, "NTFS");
        });

        it("should throw if property is assigned to", () => {
            const d = new Drive(make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("property is ready only");
                    }
                }
            }));

            assert.throws(() => d.filesystem = "ntfs");
        });
    });

    describe(".FreeSpace", () => {
        it("should return a number", () => {
            assert.isNumber(new Drive(make_ctx()).freespace);
        });

        it("should throw if property is assigned to", () => {
            const d = new Drive(make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("property is ready only");
                    }
                }
            }));

            assert.throws(() => d.FreeSPACE = 5);
        });
    });

    describe(".IsReady", () => {
        it("should return TRUE", () => {
            assert.isTrue(new Drive(make_ctx()).IsREADY);
        });

        it("should throw if property is assigned to", () => {
            const d = new Drive(make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("property is ready only");
                    }
                }
            }));

            assert.throws(() => d.isready = false);
        });
    });

    describe(".Path", () => {
        it("should return 'C:'", () => {
            assert.equal(new Drive(make_ctx()).paTH, "C:");
        });

        it("should throw if property is assigned to", () => {
            const d = new Drive(make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("property is ready only");
                    }
                }
            }));

            assert.throws(() => d.Path = "D:\\");
        });
    });

    describe(".RootFolder", () => {

        it("should return a folder object", () => {
            const d = new Drive(make_ctx());
            assert.equal(d.RootFolder.name, "");
            assert.equal(d.RootFolder.path, "C:\\");
        });

        it("should throw if property is assigned to", () => {
            const d = new Drive(make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("property is ready only");
                    }
                }
            }));

            assert.throws(() => d.RootFolder = {});
        });
    });

    describe(".SerialNumber", () => {
        it("should return a number", () => {
            assert.isNumber(new Drive(make_ctx()).SerialNumber);
        });


        it("should throw if property is assigned to", () => {
            const d = new Drive(make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("property is ready only");
                    }
                }
            }));

            assert.throws(() => d.SerialNumber = 12345);
        });
    });

    describe(".ShareName", () => {
        it("should return a string", () => {
            assert.isString(new Drive(make_ctx()).ShareName);
        });


        it("should throw if property is assigned to", () => {
            const d = new Drive(make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("property is ready only");
                    }
                }
            }));

            assert.throws(() => d.sharename = "foo");
        });
    });

    describe(".TotalSize", () => {
        it("should return a number", () => {
            assert.isNumber(new Drive(make_ctx()).Totalsize);
        });

        it("should throw if property is assigned to", () => {
            const d = new Drive(make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("property is ready only");
                    }
                }
            }));

            assert.throws(() => d.totalSIZE = 6);
        });
    });

    describe(".VolumeName", () => {
        it("should return a string", () => {
            assert.isString(new Drive(make_ctx()).VolumeName);
        });

        it("should throw if property is assigned to", () => {
            const d = new Drive(make_ctx({
                exceptions: {
                    throw_invalid_fn_arg: () => {
                        throw new Error("property is ready only");
                    }
                }
            }));

            assert.throws(() => d.VolumeName = "a");
        });
    });
});
