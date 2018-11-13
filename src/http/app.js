const path      = require("path"),
      temp      = require("temp"),
      fs        = require("fs"),
      app       = require("express")(),
      server    = require('http').Server(app),
      bodyParser = require("body-parser"),
      Construct = require("../../index");

temp.track();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "pug");
app.set("views", "src/http/views");

let analyser = new Construct({
    config: path.join("construct.cfg")
});

server.listen(3000);

app.get('/', (req, res) => {

    res.render("index", {
        title: "Construct UI",
        message: "Body body body",
        reporters: analyser.reporters
    });
});


// Returns an object which maps the reporters name to meta information
// about the reporter, such as its description.
app.get("/reporters", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(analyser.reporters);
});


app.post("/scan", function (req, res) {

    let reporter = "dumpevents";
    if (req.body.reporter) {
        reporter = req.body.reporter;
    }

    temp.open("blah", (err, info) => {

        if (!err) {

            fs.write(info.fd, req.body.code, function () {});

            fs.close(info.fd, function () {
                analyser.analyse(info.path, { reporter: reporter })
                    .then((results) => res.send(results))
                    .catch((err) => {
                        console.log(err);
                        res.send(err.message);
                    });
            });
        }
    });
});
