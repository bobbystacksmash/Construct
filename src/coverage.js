const istanbul = require("istanbul"),
      path     = require("path")

function generate_coverage_report (covobj, source, src_file_path) {

    const Report    = istanbul.Report,
          report    = Report.create("html"),
          collector = new istanbul.Collector;

    collector.add(covobj);
    report.on("done", function () {

        let report_path = path.join(process.cwd(), "html-report", "index.html");

        console.log(`Coverage report created for ${src_file_path}.`);
        console.log(`HTML report written to: file://${report_path}`);
    });

    report.writeReport(collector, true);
};

module.exports = {
    generate_coverage_report: generate_coverage_report
};
