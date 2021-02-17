const axios = require("axios");
const parser = require("node-html-parser");
const utils = require("./utils");

const WEB_SEARCH_URL = "https://www.google.com/search?q=";

exports.search = async (artist, songTitle) => {
  const url = await getShironetPage(artist, songTitle);
  if (!url) {
    return null;
  }
  return getSongDetails(url);
};

/*
 * Find Shironet song page by artist and title
 * Uses Google because Shironet search returns garbage
 * Returns URL
 */
function getShironetPage(artist, songTitle) {
  const query = encodeURI(artist + " - " + songTitle + " - שירונט");
  return axios
    .get(WEB_SEARCH_URL + query)
    .then((result) => {
      let start = result.data.indexOf("/url?q=https://shironet.mako.co.il/");
      if (start < 0) {
        return null;
      }
      start += 7;
      const end = result.data.indexOf('"', start);
      const link = decodeURIComponent(result.data.substring(start, end));
      if (link.substr(0, 4) !== "http") {
        //console.log("Wrong link: query: " + query + "\nlink: " + link);
        return null;
      }
      return link;
    })
    .catch((err) => {
      console.log("getShironetPage: error fetching:", WEB_SEARCH_URL + query);
      if (err.response) {
        console.log(err.response.status, err.response.statusText);
        utils.writeFile("error-search.html", err.response.data);
      } else {
        utils.writeJsonFile("error-search.json", err);
      }
      throw "Error search for Shironet page";
    });
}

function getMetaAttribute(root, name) {
  const node = root.querySelector("meta[itemprop='" + name + "']");
  if (node) {
    const value = node.getAttribute("content");
    if (value) {
      return value.replace(/,/g, ";");
    }
  }
  return null;
}

function parseLyrics(lyrics) {
  return lyrics && lyrics.replace(/<br>/g, "");
}

/*
 * Gets song details from Shironet
 * param: url - song page URL (e.g. https://shironet.mako.co.il/artist?type=lyrics&lang=1&prfid=1015&wrkid=44217)
 * returns: details: {songTitle, artist, lyricists, composers}
 */
function getSongDetails(url) {
  return axios
    .get(url)
    .then((result) => {
      result = result.data;
      const root = parser.parse(result);
      const titleNode = root.querySelector("h1[class='artist_song_name_txt']");
      const artistNode = root.querySelector("meta[itemprop='byArtist']");
      if (!titleNode || !artistNode) {
        return null;
      }
      const lyricsNode = root.querySelector("span[itemprop='Lyrics']");
      const details = {
        songTitle: titleNode && titleNode.textContent.trim(),
        artist: getMetaAttribute(root, "byArtist"),
        lyricists: getMetaAttribute(root, "lyricist"),
        composers: getMetaAttribute(root, "composer"),
        lyrics: parseLyrics(lyricsNode && lyricsNode.textContent),
      };
      return details;
    })
    .catch((err) => {
      console.log("getSongDetails: error:", err);
    });
}
