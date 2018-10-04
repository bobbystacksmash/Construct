// Technique for using Grunt + Jison adapted from the handlebars.js project:
//
//   - https://github.com/wycats/handlebars.js/blob/master/tasks/parser.js
//
const child_proc = require("child_process");

module.exports = function (grunt) {

    grunt.registerTask("lexer", "Generate the Jison lexer.", function (){

        const done = this.async();

        let cmd  = './node_modules/.bin/jison-lex';

        if (process.platform === "win32") {
            cmd = 'node_modules\\.bin\\jison-lex.cmd';
        }

        var child = child_proc.spawn(cmd, ["src/lib/cstsc/jscript.l", "-o", "./src/lib/cstsc/jscriptlex.js", "-t", "commonjs"], {stdio: "inherit"});
        child.on("exit", function (status) {
            if (status != 0) {
                grunt.fatal("Jison failure: " + status);
                done();
                return;
            }
        });

        grunt.log.writeln("Successfully created lexer: jscriptlex.js");
        done();
    });
};
