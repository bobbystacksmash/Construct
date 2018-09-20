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
            cmd = 'node_modules\\.bin\\jison.cmd';
        }

        var child = child_proc.spawn(cmd, ["src/lib/cstsc/cc.l", "-o", "src/lib/cstsc/cc.js"], {stdio: "inherit"});
        child.on("exit", function (status) {
            if (status != 0) {
                grunt.fatal("Jison failure: " + status);
                done();
                return;
            }
        });

        // Now we've written the file, we need to move it to its
        // rightful home.
        //const lexer_src = grunt.file.read("cc.js");
        //grunt.file.delete("cc.js");
        //grunt.file.write("src/lib/cstsc/lexer.js", lexer_src);

        grunt.log.writeln("Successfully created lexer.");
        done();
    });
};
