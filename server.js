const express = require('express');
const app     = express();

app.use(express.static('dist'));

app.get("/fetch/:site", (req, res) => {
    console.log(`GET request made for: ${req.params}`);
    res.send("Get request for something...");
});

app.listen(3000, () => { console.log("Webserver listening on port 3000")});
