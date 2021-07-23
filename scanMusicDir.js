const NodeID3 = require("node-id3");
const glob = require("glob");
const path = require("path");
var stringSimilarity = require("string-similarity");
//const discogs = require("./discogs");
const shironet = require("./shironet");
const utils = require("./utils");

const REPORTS_PATH = "./src/reports";
const SCANNED_FILE_PATH = REPORTS_PATH + "/scanned-files.json";
const ERRORS_REPORT_PATH = REPORTS_PATH + "/report-errors.json";
const DETAILS_DB_PATH = REPORTS_PATH + "/details-db.json";
const scannedFiles = require(SCANNED_FILE_PATH);
const errorsReport = require(ERRORS_REPORT_PATH);
const detailsDb = require(DETAILS_DB_PATH);

const STATUS_MISSING = "Missing information";
const STATUS_ALREADY = "Already updated";
const STATUS_NOT_FOUND = "Not found";
const STATUS_DIFF_TITLE = "Different title";
const STATUS_UPDATED = "Updated";
const STATUS_SKIPPED = "Skipped";

if (process.argv.length <= 2) {
  console.log("Usage: " + __filename + " path/to/directory [callouts limit]");
  process.exit(-1);
}
const runPath = process.argv[2];
const limitCalls = process.argv[3] || 1000;
console.log(
  "scanning: " +
    runPath +
    (limitCalls ? ", up to " + limitCalls + " callouts" : "")
);

updateDirFromShironet(runPath);

console.log("Scan done.\nRun start:listener.js and start:app to examine erros.");

function updateId3(filepath, id3, details) {
  const newId3 = {
    ...id3,
    textWriter: details.lyricists,
    composer: details.composers,
    unsynchronisedLyrics: {
      language: "heb",
      shortText: null,
      text: details.lyrics,
    },
  };
  NodeID3.update(newId3, filepath, function (err) {});
}

function reduceId3(id3) {
  return {
    artist: id3.artist,
    title: id3.title,
    composer: id3.composer,
    textWriter: id3.textWriter,
  };
}

function compare(str1, str2) {
  const n = stringSimilarity.compareTwoStrings(str1, str2);
  return Math.round(n * 10) / 10;
}

async function updateFileFromShironet(filepath) {
  //console.log("updateFileFromShironet:", filepath);
  const id3 = NodeID3.read(filepath);

  const report = {
    filepath,
    filename: path.basename(filepath),
    dir: path.dirname(filepath),
    status: null,
    callout: false,
    modified: false,
  };
  let details;

  if (errorsReport[filepath]) {
    report.passed = true;
    report.status = STATUS_SKIPPED;
  } else if (!id3.artist || !id3.title) {
    report.status = STATUS_MISSING;
  } else if (id3.composer && id3.textWriter && id3.unsynchronisedLyrics) {
    report.status = STATUS_ALREADY;
  } else {
    // check in local db
    const storedId3 = detailsDb[id3.artist + "_" + id3.title];
    if (storedId3 && storedId3.unsynchronisedLyrics) {
      NodeID3.update(storedId3, filepath);
      report.modified = true;
      report.status = STATUS_UPDATED;
    } else {
      // fetch details from Shironet
      report.callout = true;
      details = await shironet.search(id3.artist, id3.title);

      // check results
      if (!details || (!details.composers && !details.lyricists)) {
        report.status = STATUS_NOT_FOUND;
      } else {
        report.artistSimilarity = compare(details.artist, id3.artist);
        report.titleSimilarity = compare(details.songTitle, id3.title);
        if (
          report.artistSimilarity >= 0.8 &&
          (report.titleSimilarity >= 0.8 ||
            (details.songTitle.length > 5 &&
              id3.title.indexOf(details.songTitle) === 0))
        ) {
          updateId3(filepath, id3, details);
          report.modified = true;
          report.status = STATUS_UPDATED;
        } else if (
          details.artist !== id3.artist &&
          details.songTitle !== id3.title
        ) {
          report.status = STATUS_NOT_FOUND;
        } else {
          report.status = STATUS_DIFF_TITLE;
        }
      }
    }
  }
  return {
    ...report,
    id3: reduceId3(id3),
    details,
  };
}

function createReportObj(path, items, dirFiles) {
  const report = {
    path,
    processed: items.length,
    dirFiles,
    limitCalls,
    callouts: items.filter((item) => item.callout).length,
    modified: items.filter((item) => item.modified).length,
    statuses: {},
    items: items,
  };

  items.forEach((item) => {
    if (report.statuses[item.status]) {
      report.statuses[item.status]++;
    } else {
      report.statuses[item.status] = 1;
    }
  });
  return report;
}

async function updateDirFromShironet(runPath) {
  glob(runPath + "/**/*.mp3", async function (er, files) {
    const fullReports = [];
    let callouts = 0;
    let halt = false;
    for (let i = 0; i < files.length && (callouts < limitCalls) & !halt; i++) {
      const file = files[i];
      if (!scannedFiles[file]) {
        console.log("Handling file", i, path.basename(file));
        const result = await updateFileFromShironet(file).catch((err) => {
          console.log("halt error:", err);
          halt = true;
        });
        if (result) {
          fullReports.push(result);
          if (result.status === STATUS_DIFF_TITLE) {
            errorsReport[file] = result;
          }
          if (result.callout) {
            callouts++;
          }
          scannedFiles[file] = result.status;
        }
      } else {
        console.log("Skipping file", path.basename(file));
      }
    }
    console.log();
    const report = createReportObj(runPath, fullReports, files.length);
    utils.writeJsonFile(REPORTS_PATH + "/report-full.json", report);
    utils.writeJsonFile(REPORTS_PATH + "/report-errors.json", errorsReport);
    utils.writeJsonFile(REPORTS_PATH + "/scanned-files.json", scannedFiles);
  });
}
