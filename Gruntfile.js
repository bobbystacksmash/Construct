module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Tasks can be found in the './tasks' folder.
    grunt.task.loadTasks('tasks');

    grunt.initConfig({

        mochaTest: {
            test: {
                options: {
                    reporter: "spec"
                },
                src: ['test/**/*_test.js']
            }
        },

        watch: {
            scripts: {
                options: {
                    atBegin: true
                },

                files: ['src/**/*.js', 'test/**/*.js', 'index.js', 'construct.cfg'],
                tasks: ['mochaTest']
            }
        }
    });

    grunt.registerTask("build", ["mochaTest"]);
    grunt.registerTask('dev',     ['watch']);
    grunt.registerTask('default', ['build', 'mochaTest']);
};
