const fs = require("fs");

exports.writeJsonFile = async (filename, data) => {
  module.exports.writeFile(filename, JSON.stringify(data, null, 2));
};

exports.writeFile = async (filename, data) => {
  fs.writeFile(filename, data, (err) => {
    console.log("created " + filename, err || "");
  });
};
