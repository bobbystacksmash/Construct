const express = require("express");
const url     = require("url");
const fs      = require("fs");
const app     = express();

app.use(express.static('dist'));

app.get("/fetch/:site", (req, res) => {
    console.log(`GET request made for: ${req.originalUrl}`);
    res.setHeader("Content-Type", "application/x-msdownload");
    var file = fs.createReadStream("./eicar.com");
    file.pipe(res);
});


app.post("/fetch/:site", (req, res) => {
    console.log(`POST request made for: ${req.originalUrl}`);
});


app.listen(3000, () => { console.log("Webserver listening on port 3000")});
