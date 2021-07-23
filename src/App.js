import React, { useState } from "react";
import "./App.css";
//import ITEMS from "./reports/report-errors";

const ROWS_DISPLAYED = 3;
const BACKEND_URL = "http://localhost:5000";
const GET_ITEMS_ENDPOINT = BACKEND_URL + "/getErrorsReport";
const GET_AUDIO_ENDPOINT = BACKEND_URL + "/getSong?file=";
const UPDATE_SONG_ENDPOINT = BACKEND_URL + "/updateSong";
const REJECT_SONG_ENDPOINT = BACKEND_URL + "/rejectSong";
const UPDATE_REPORTS_ENDPOINT = BACKEND_URL + "/updateReports";

const items = [];
let startFrom = 0;

async function getItems() {
  const ITEMS = await fetch(GET_ITEMS_ENDPOINT).then((response) =>
    response.json()
  );
  Object.keys(ITEMS).forEach((key) => {
    const item = ITEMS[key];
    if (item.status === "Different title") {
      item.audioUrl = GET_AUDIO_ENDPOINT + item.filepath;
      items.push(item);
    }
  });
  //console.log("items:", items.length);

  if (items.length > ROWS_DISPLAYED) {
    startFrom = Math.floor(Math.random() * (items.length - ROWS_DISPLAYED));
  }
}

function getItem(filepath) {
  const i = items.findIndex((item) => item.filepath === filepath);
  const item = items[i];
  return [item, i];
}

function App() {
  const [approvedNum, setApprovedNum] = useState();
  const [rejectedNum, setRejectedNum] = useState(0);
  const [played, setPlayed] = useState(0);

  if (!items.length) {
    getItems().then(() => {
      console.log("App items after:", items.length);
      setApprovedNum(0);
    })
  }

  const setCopyTitle = (event) => {
    const [item] = getItem(event.target.name);
    item.copyTitle = true;
  };

  const setCopyArtist = (event) => {
    const [item] = getItem(event.target.name);
    item.copyArtist = true;
  };

  const setLyricsOnly = (event) => {
    const [item] = getItem(event.target.name);
    item.copyLyricsOnly = true;
  };

  const playSong = (event) => {
    const [item] = getItem(event.target.name);
    item.playSong = true;
    setPlayed(played + 1);
  };

  const approve = (event) => {
    console.log("approve", event.target.name);
    //const i = items.findIndex((item) => item.filepath === event.target.name);
    //const item = items[i];
    const [item, i] = getItem(event.target.name);

    fetch(UPDATE_SONG_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    })
      .then((response) => {
        if (response.status === 200) {
          items.splice(i, 1);
          setApprovedNum(approvedNum + 1);
        } else {
          alert("error");
        }
      })
      .catch((error) => {
        console.log("error:", error);
      });
  };

  const reject = (event) => {
    console.log("reject", event.target.name);
    const [item, i] = getItem(event.target.name);

    fetch(REJECT_SONG_ENDPOINT + "?file=" + item.filepath)
      .then((response) => {
        if (response.status === 200) {
          items.splice(i, 1);
          setRejectedNum(rejectedNum + 1);
        } else {
          alert("error");
        }
      })
      .catch((error) => {
        console.log("error:", error);
      });
  };

  const saveReports = (event) => {
    console.log("saveReports");
    //const i = items.findIndex((item) => item.filepath === event.target.name);
    //const item = items[i];

    fetch(UPDATE_REPORTS_ENDPOINT)
      .then((response) => {
        console.log("response:", response.status);
        if (response.status !== 200) {
          alert("error");
        }
      })
      .catch((error) => {
        console.log("error:", error);
      });
  };

  return (
    <div className="App" dir="rtl">
      <table width="100%">
        <tbody>
          <tr>
            <td>
              <h1>
                Approved: {approvedNum} / {items.length}
              </h1>
            </td>
            <td>
              <h1>Rejected: {rejectedNum}</h1>
              Played: {played}
            </td>
          </tr>
        </tbody>
      </table>
      <div>
        <button onClick={saveReports}>שמור</button>
      </div>
      <table border="1" width="80%">
        <thead>
          <tr>
            <th>שם</th>
            <th>Id3</th>
            <th>שירונט</th>
            <th>אישור</th>
          </tr>
        </thead>
        <tbody>
          {items.map(
            (item, index) =>
              index >= startFrom &&
              index < startFrom + ROWS_DISPLAYED && (
                <React.Fragment key={item.filepath}>
                  <tr>
                    <td>{item.filename}</td>
                    <td>
                      {item.id3.artist} - {item.id3.title}
                    </td>
                    <td>
                      {item.details.artist} - {item.details.songTitle}
                    </td>
                    <td width="140">
                      <button name={item.filepath} onClick={approve}>
                        אותו שיר
                      </button>
                      <button name={item.filepath} onClick={reject}>
                        לא שייך
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {!item.playSong && (
                        <button name={item.filepath} onClick={playSong}>Play</button>
                      )}
                      {item.playSong && (
                      <audio
                        controls
                        src={item.audioUrl}
                        type="audio/mpeg"
                        autoPlay
                      ></audio>
                      )}
                    </td>
                    <td colSpan="2">
                      מילים: {item.details.lyricists}; לחן:{" "}
                      {item.details.composers}
                      <br></br>
                      {item.details.lyrics}
                    </td>
                    <td>
                      <div>
                        <input
                          type="checkbox"
                          name={item.filepath}
                          onClick={setCopyTitle}
                        ></input>
                        שנה שם
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          name={item.filepath}
                          onClick={setCopyArtist}
                        ></input>
                        שנה אמן
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          name={item.filepath}
                          onClick={setLyricsOnly}
                        ></input>
                        רק מילים
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              )
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;
