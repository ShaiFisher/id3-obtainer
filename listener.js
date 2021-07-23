const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const NodeID3 = require("node-id3");
const utils = require("./utils");

const REPORTS_PATH = "./src/reports";
const ERRORS_REPORT_PATH = REPORTS_PATH + "/report-errors.json";
const SCANNED_FILES_PATH = REPORTS_PATH + "/scanned-files.json";
const errorsReport = require(ERRORS_REPORT_PATH);
const scannedFiles = require(SCANNED_FILES_PATH);
//console.log("errorsReport:", errorsReport)

var app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get("/getErrorsReport", function (req, res) {
  console.log("getErrorsReport");
  res.send(errorsReport);
});

app.get("/getSong", function (req, res) {
  console.log("getSong:", req.query.file);
  res.sendFile(req.query.file);
});

app.get("/rejectSong", function (req, res) {
  const filepath = req.query.file;
  delete errorsReport[filepath];
  scannedFiles[filepath] = "Nof found";
  res.send();
});

app.post("/updateSong", function (req, res) {
  console.log("updateSong:", req.body.filename);
  if (req.body) {
    const filepath = req.body.filepath;
    const success = updateId3(req.body.filepath, req.body);
    console.log("success:", success);
    if (success) {
      //const errors = fs.readFileSync('./report-errors.json', 'utf8');
      scannedFiles[filepath] = "Updated";
      delete errorsReport[filepath];
      res.send();
    } else {
      res.status(500);
      res.send(success);
    }
  }
});

app.get("/updateReports", function (req, res) {
  updateFiles();
  res.send();
});

let port = process.env.PORT || 5000;
app.listen(port);
console.log("Server running on port", port);

function updateId3(filepath, item) {
  console.log("updateId3:", filepath);
  //const id3 = NodeID3.read(filepath);
  const newId3 = {
    textWriter: item.details.lyricists,
    unsynchronisedLyrics: {
      language: "heb",
      shortText: null,
      text: item.details.lyrics,
    },
  };
  if (item.copyTitle) {
    newId3.title = item.details.songTitle;
  }
  if (item.copyArtist) {
    newId3.artist = item.details.artist;
  }
  if (!item.copyLyricsOnly) {
    newId3.composer = item.details.composers;
  }
  console.log("newId3:", newId3);
  try {
    return NodeID3.update(newId3, filepath);
  } catch (err) {
    console.log("updateId3: err:", err);
  }
}

function updateFiles() {
  utils.writeJsonFile(ERRORS_REPORT_PATH, errorsReport);
  utils.writeJsonFile(SCANNED_FILES_PATH, scannedFiles);
}
