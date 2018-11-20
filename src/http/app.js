const path       = require("path"),
      temp       = require("temp"),
      fs         = require("fs"),
      express    = require("express"),
      http       = require("http"),
      bodyParser = require("body-parser"),
      Construct  = require("../../index");

const app    = express(),
      server = http.Server(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "pug");
app.set("views", "src/http/views");
app.use(express.static("src/http/public"));
server.listen(8080);

temp.track();

app.get('/', (req, res) => {

    let analyser = new Construct({
        config: path.join("construct.cfg")
    });

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

    let analyser = new Construct({
        config: path.join("construct.cfg")
    });
    res.send(analyser.reporters);
});


app.post("/scan", function (req, res) {

    let reporter = "dumpevents";
    if (req.body.reporter) {
        reporter = req.body.reporter;
    }

    temp.open("tmpfile", (err, info) => {

        if (!err) {

            fs.write(info.fd, req.body.code, function () {});

            fs.close(info.fd, function () {

                let analyser = new Construct({
                    config: path.join("construct.cfg")
                });

                analyser.analyse(info.path, { reporter: reporter })
                    .then((results) => {
                        res.send(results);
                    })
                    .catch((err) => {
                        console.log(err);
                        res.send(err.message);
                    });
            });
        }
    });
});
