//
// The /sane/ thing to do is to use Istanbul's coverage code to export
// a HTML document, however, there's an issue that hasn't been fixed
// for two years which prevents us from doing that, so we will create
// the coverage report ourselves.
//
function generate_coverage_report (covobj, source, output_filename) {

    const source_lines = source.split(/\r?\n/),
          filename_key = Object.keys(covobj)[0];

    Object.keys(covobj[filename_key]).forEach(part => {
        if (part !== "fnMap") return;

        Object.keys(covobj[filename_key][part]).forEach(fn => {

            const fncov = covobj[filename_key][part][fn];
            console.log(fncov);

        });
    });
};

module.exports = {
    generate_coverage_report: generate_coverage_report
};
