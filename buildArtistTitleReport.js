const NodeID3 = require("node-id3");
const glob = require("glob");
const path = require("path");
const utils = require("./utils");

const REPORTS_PATH = "./src/reports";
const SCANNED_FILE_PATH = REPORTS_PATH + "/scanned-files-db.json";
const DETAILS_DB_PATH = REPORTS_PATH + "/details-db.json";

const scannedFiles = require(SCANNED_FILE_PATH);
const detailsDb = require(DETAILS_DB_PATH);

if (process.argv.length <= 2) {
  console.log("Usage: " + __filename + " path/to/directory [callouts limit]");
  process.exit(-1);
}
const runPath = process.argv[2];
const limit = process.argv[3] || 1000;
console.log("scanning: " + runPath + ", up to " + limit + " Files");

scanDir(runPath);

function scanFile(filepath) {
  const id3 = NodeID3.read(filepath);
  if (
    id3.artist &&
    id3.title &&
    (id3.composer || id3.textWriter || id3.unsynchronisedLyrics)
  ) {
    const key = id3.artist + "_" + id3.title;
    detailsDb[key] = merge(id3, detailsDb[key]);
  }
}

function scanDir(runPath) {
  glob(runPath + "/**/*.mp3", async function (er, files) {
    let newScanned = 0;
    for (let i = 0; i < files.length && newScanned < limit; i++) {
      const file = files[i];
      if (!scannedFiles[file]) {
        console.log("Handling file", i, newScanned, path.basename(file));
        scanFile(file);
        scannedFiles[file] = true;
        newScanned++;
      } else {
        console.log("Skipping file", path.basename(file));
      }
    }
    console.log();
    utils.writeJsonFile(SCANNED_FILE_PATH, scannedFiles);
    utils.writeJsonFile(DETAILS_DB_PATH, detailsDb);
  });
}

function merge(id3, dbId3) {
  dbId3 = dbId3 || {};
  return {
    title: id3.title,
    artist: id3.artist,
    textWriter: id3.textWriter || dbId3.textWriter,
    composer: id3.composer || dbId3.composer,
    unsynchronisedLyrics:
      id3.unsynchronisedLyrics || dbId3.unsynchronisedLyrics,
  };
}
