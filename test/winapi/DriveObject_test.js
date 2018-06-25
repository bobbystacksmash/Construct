const assert            = require("chai").assert;
const Drive            = require("../../src/winapi/DriveObject");
const VirtualFileSystem = require("../../src/runtime/virtfs");

function make_ctx (opts) {

    opts = opts || {};

    opts.exceptions  = opts.exceptions  || {};
    opts.environment = opts.environment || {};
    opts.config      = opts.config      || {};

    var default_env = {
        path: "C:\\Users\\Construct"
    };

    var default_cfg = {
        "autovivify": true
    };

    let env   = Object.assign({}, default_env, opts.environment),
        cfg   = Object.assign({}, default_cfg, opts.config),
        epoch = opts.epoch || 1234567890;

    let context = {
        epoch: epoch,
        ENVIRONMENT: env,
        CONFIG: cfg,
        emitter: { emit: () => {} },
        get_env: (e) => env[e],
        get_cfg: (c) => cfg[c]
    };

    let vfs = new VirtualFileSystem(context);
    context.vfs = vfs;
    return Object.assign({}, context, opts);
}

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
        // TODO!


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
