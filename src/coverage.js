const istanbul = require("istanbul");

function generate_coverage_report (covobj, source, output_filename) {

    const Report    = istanbul.Report,
          report    = Report.create("html"),
          collector = new istanbul.Collector;

    collector.add(covobj);
    report.on("done", function () {
        console.log("Report created.");
    });

    report.writeReport(collector, true);
};

module.exports = {
    generate_coverage_report: generate_coverage_report
};
