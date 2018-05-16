const falafel = require("falafel"),
      fs      = require("fs");

if (process.argv.length === 2) {
    console.log("No input files supplied.");
    process.exit(1);
}

let contents_of_all_files = process.argv.slice(2)
        .map(f => fs.readFileSync(f).toString());

contents_of_all_files.forEach((file_contents) => {
    falafel(file_contents, (node) => {
        if (node.type === "Literal") {
            console.log(node.value);
        }
    });
});
