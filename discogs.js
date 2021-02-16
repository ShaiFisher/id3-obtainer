const Discogs = require("disconnect").Client;
const fs = require("fs");

const ACCESS_TOKEN = "TMFzsWOxmLVkhwOtnwwCvOADsVmJRulmJxGHQiNA";

exports.search = (artist, album, songTitle) => {
  return new Promise((resolve, reject) => {
    var db = new Discogs({
      userToken: ACCESS_TOKEN,
    }).database();
    const params = {
      artist: artist,
    };
    if (album) {
      params.release_title = album;
    }
    if (songTitle) {
      params.track = songTitle;
    }
    console.log("search params:", params);
    db.search(params, function (err, data) {
      console.log(data);
      fs.writeFile("result.json", JSON.stringify(data), (err) => {});
      const releasesIds = [];
      data.results.forEach((item) => {
        console.log("item id:", item.id, item.title);
        releasesIds.push(item.id);
        /*db.getRelease(item.id, function (err, data) {
          //console.log(data);
          fs.writeFile(item.id + ".json", JSON.stringify(data), (err) => {});
        });*/
      });
      resolve(releasesIds);
    });
  });
};

exports.getTracks = (artist, album) => {
  exports.search(artist, album).then((result) => {
    console.log("getTracks: result:", result);
  });
};
