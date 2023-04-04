var express = require("express");
var cors = require("cors");
var app = express();
var http = require("http").createServer(app);
app.use(cors());

const axios = require("axios").default;

let activeRooms = [];

// Proprietary stable sorting algorithm
var stableSort = (arr, compare) =>
  arr
    .map((item, index) => ({ item, index }))
    .sort((a, b) => compare(a.item, b.item) || a.index - b.index)
    .map(({ item }) => item);

// Sort a rooms queue from biggest to smallest
function sortQueue(roomId) {
  activeRooms.filter(function (item) {
    return item.roomID == roomId;
  })[0]["queue"] = stableSort(
    activeRooms.filter(function (item) {
      return item.roomID == roomId;
    })[0]["queue"],
    (a, b) => b.votes - a.votes
  );
}

// Array of rooms to temporarily ignore adding new songs to
var inactiveRoomQueues = [];

// Add room name temporarily to list of rooms to not check queue, prevents duplicate add
function tempAddToList(name) {
  inactiveRoomQueues.push(name);
  setTimeout(() => removeFromListByName(name), 13000);
}

// helper function to remove an element from inactiveRoomQueues a list by value
function removeFromListByName(valueToRemove) {
  inactiveRoomQueues = inactiveRoomQueues.filter(
    (item) => item !== valueToRemove
  );
}

// helper function to generate the structure of the auth header used in requests
function getAuthHeader(authToken) {
  return {
    headers: {
      Authorization: "Bearer " + authToken,
    },
  };
}

// Loop through all the active rooms and check if they are ready for the next song to be queued
function checkRooms() {
  for (let i = 0; i < activeRooms.length; i++) {
    checkQueue(activeRooms[i]["authToken"], activeRooms[i]["roomID"]);
  }
}
setInterval(checkRooms, 3000);

// Get top song's id and remove it from the queue
function getAndDeleteTopSong(roomId) {
  try {
    var temp = activeRooms
      .filter(function (item) {
        return item.roomID == roomId;
      })[0]
      ["queue"].shift()["id"];
    console.log(temp);
    return temp;
  } catch (e) {
    console.log(roomId, "ERROR fetching top song");
    return null;
  }
}

// Check if room is ready for next song to be queued
async function checkQueue(authToken, roomId) {
  const url = "https://api.spotify.com/v1/me/player";
  try {
    const response = await axios.get(url, getAuthHeader(authToken));
    const data = response.data;
    const timeToEnd = data["item"]["duration_ms"] - data["progress_ms"];
    console.log(roomId, timeToEnd);
    if (timeToEnd < 10000) {
      addToQueue(authToken, roomId);
    }
  } catch (e) {
    console.log(e?.response?.data);
    console.log(roomId, "No music playing");
    // console.log("ERROR", e.message, e.response.data, e.response.status, e.response.headers);
  }
}

// Add song to end of queue
async function addToQueue(authToken, roomId) {
  if (inactiveRoomQueues.includes(roomId)) {
    console.log(roomId, "already added song to queue, skipping...");
    return;
  }
  let trackId = "spotify:track:" + getAndDeleteTopSong(roomId);
  tempAddToList(roomId);
  const url = "https://api.spotify.com/v1/me/player/queue?uri=" + trackId;
  const config = getAuthHeader(authToken);
  try {
    const response = await axios.post(url, {}, config);
    const data = response.data;
    if (!data) {
      console.log(roomId, "succesfully queued ", trackId);
    }
  } catch (e) {
    console.log(
      "ERROR",
      e.message,
      e.response.data,
      e.response.status,
      e.response.headers
    );
  }
}

// Create new room after redirect from Spotify authentication
app.get("/loggedin", function (req, res) {
  const accessToken = req.query.token;
  console.log(accessToken);
  const newRoomId = Math.floor(Math.random() * (10000 - 1000) + 1000);

  activeRooms.push({
    roomID: newRoomId,
    authToken: accessToken,
    queue: [],
  });
  console.log(activeRooms);
  res.redirect("http://localhost:3001/room/" + newRoomId);
});

// Get room's playlist returns data in form of:
// [
//     {
//         id: "3ee8Jmje8o58CHK66QrVC2",
//         votes: 3
//     },
//     {
//         id: "46OFHBw45fNi7QNjSetITR",
//         votes: 0
//     },
// ]
app.get("/api/getPlaylist/:roomid", function (req, res) {
  const roomId = parseInt(req.params.roomid);
  try {
    const playlist = activeRooms.filter(function (item) {
      return item.roomID == roomId;
    })[0]["queue"];
    res.json(playlist);
  } catch (e) {
    res.json({});
  }
});

// Add song to playlist, example POST request
// http://localhost:3000/api/addToPlaylist/123?songId=46OFHBw45fNi7QNjSetITR
app.post("/api/addToPlaylist/:roomid", function (req, res) {
  const roomId = parseInt(req.params.roomid);
  const songId = req.query.songId;
  activeRooms
    .filter(function (item) {
      return item.roomID == roomId;
    })[0]
    ["queue"].push({ id: songId, votes: 1 });
  // sortQueue(roomId)
  console.log(roomId, "Added song", songId);
  res.json({ added_song: songId });
});

// Upvote/downvote song, params= [songID, voteType] where voteType is one of ["up", "down"]
// Example POST http://localhost:3000/api/songVote/123?songId=46OFHBw45fNi7QNjSetITR&voteType=down
app.post("/api/songVote/:roomid", function (req, res) {
  const roomId = parseInt(req.params.roomid);
  const songId = req.query.songId;
  const voteType = req.query.voteType;
  const toAdd = voteType === "up" ? 1 : -1;

  activeRooms
    .filter(function (item) {
      return item.roomID == roomId;
    })[0]
    ["queue"].filter(function (item) {
      return item.id == songId;
    })[0]["votes"] += toAdd;
  sortQueue(roomId);
  console.log(roomId, "Song", songId, "incremented by", toAdd);
  res.json({ song_voted_on: songId });
});

// Get authentication token by roomId
app.get("/api/getAuthToken/:roomid", function (req, res) {
  const roomId = parseInt(req.params.roomid);
  const room = activeRooms.filter(function (item) {
    return item.roomID == roomId;
  })[0];
  if (!room) {
    return res.redirect("http://localhost:3001/");
  }
  res.json({ authToken: room.authToken });
});

// Check if room is active
app.get("/api/isActiveRoom/:roomid", function (req, res) {
  const roomId = parseInt(req.params.roomid);
  const authToken =
    activeRooms.filter(function (item) {
      return item.roomID === roomId;
    }).length === 1;
  res.json({ isActiveRoom: authToken });
});

// Listen on port 3000
var port = 3000;
http.listen(port, () =>
  console.log(`Server listening http://localhost:${port}`)
);
