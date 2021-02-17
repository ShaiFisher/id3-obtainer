const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const NodeID3 = require("node-id3");
const fs = require("fs");
const utils = require("./utils");
const REPORTS_PATH = "./src/reports";
const errorsReport = require(REPORTS_PATH + "/report-errors.json");
//console.log("errorsReport:", errorsReport)

var app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/getSong", function (req, res) {
  console.log("getSong:", req.query.file);
  res.sendFile(req.query.file);
});

app.post("/updateSong", function (req, res) {
  console.log("updateSong:", req.body.filename);
  if (req.body) {
    const filepath = req.body.filepath;
    const success = updateId3(req.body.filepath, req.body.details);
    console.log("success:", success);
    if (success) {
      //const errors = fs.readFileSync('./report-errors.json', 'utf8');
      delete errorsReport[filepath];
      utils.writeJsonFile(ERRORS_REPORT_PATH, errorsReport);
      res.send();
    } else {
      res.status(500);
      res.send(success);
    }
  }
});

let port = process.env.PORT || 5000;
app.listen(port);
console.log("Server running on port", port);

function updateId3(filepath, details) {
  console.log("updateId3:", filepath, details);
  //const id3 = NodeID3.read(filepath);
  const newId3 = {
    textWriter: details.lyricists,
    composer: details.composers,
    unsynchronisedLyrics: {
      language: "heb",
      shortText: null,
      text: details.lyrics,
    },
  };
  try {
    return NodeID3.update(newId3, filepath);
  } catch (err) {
    console.log("updateId3: err:", err);
  }
}
