module.exports = {
    description: "Registry Hello World plugin",
    version: "0.1.0",
    author: "Unknown",
    onload: onload
};

function onload (hook) {

    ctx = this;

    hook.registry(
        "Hello world registry plugin",
        "read",
        /.*/g,
        function (regpath) {
            ctx.vfs.AddFolder("C:\\foo");
            return "C:\\foo";
        }
    );
}
