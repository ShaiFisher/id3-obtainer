import React, { useState } from "react";
import "./App.css";
import ITEMS from "./reports/report-errors";

const ROWS_DISPLAYED = 10;
const BACKEND_URL = "http://localhost:5000";
const GET_AUDIO_ENDPOINT = BACKEND_URL + "/getSong?file=";
const UPDATE_SONG_ENDPOINT = BACKEND_URL + "/updateSong";

const items = [];
Object.keys(ITEMS).forEach((key) => {
  const item = ITEMS[key];
  if (item.status === "Different artist" || item.status === "Different title") {
    item.audioUrl = GET_AUDIO_ENDPOINT + item.filepath;
    items.push(item);
  }
});
//console.log("items:", items);

const approved = [];
const rejected = [];

function popItem(filepath) {
  const i = items.findIndex((item) => item.filepath === filepath);
  const item = items[i];
  items.splice(i, 1);
  return item;
}

function App() {
  const [approvedJson, setApprovedJson] = useState("");
  const [rejectedJson, setRejectedJson] = useState("");
  const [approvedNum, setApprovedNum] = useState(0);
  const [rejectedNum, setRejectedNum] = useState(0);

  const approve = (event) => {
    console.log("approve", event.target.name);
    const i = items.findIndex((item) => item.filepath === event.target.name);
    const item = items[i];

    setApprovedNum(approvedNum + 1);
    fetch(UPDATE_SONG_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    })
      .then((response) => {
        console.log("response:", response.status);
        if (response.status === 200) {
          approved.push(item);
          items.splice(i, 1);
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
    const item = popItem(event.target.name);
    rejected.push(item);
    setRejectedNum(rejectedNum + 1);
  };

  const apply = () => {
    setApprovedJson(JSON.stringify(approved, null, 2));
    console.log("approvedJson:", approvedJson);
    setRejectedJson(JSON.stringify(rejected, null, 2));
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
              {approvedJson && (
                <textarea value={approvedJson}>{approvedJson}</textarea>
              )}
            </td>
            <td>
              <h1>Rejected: {rejectedNum}</h1>
            </td>
          </tr>
        </tbody>
      </table>
      <div>
        <button onClick={apply}>החל</button>
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
              index < ROWS_DISPLAYED && (
                <React.Fragment key={item.filepath}>
                  <tr>
                    <td>
                      {item.filename}
                    </td>
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
                      <audio
                        controls
                        src={item.audioUrl}
                        type="audio/mpeg"
                      ></audio>
                    </td>
                    <td colSpan="3">{item.details.lyrics}</td>
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
