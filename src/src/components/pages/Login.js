import React from "react";

const Login = () => {
  const client_id = "68d23e6d395845a6a67955ec5cf33af1";
  const redirect_uri = "http://localhost:3001/loggedIn";
  const scope = [
    "user-read-private",
    "user-read-recently-played",
    "user-top-read",
    "playlist-modify-public",
    "playlist-read-private",
    "playlist-modify-private",
    "playlist-read-collaborative",
    "app-remote-control",
    "user-modify-playback-state",
    "user-read-recently-played",
    "user-read-playback-state",
    "user-read-playback-position",
    "user-read-currently-playing",
  ].join(" ");

  window.location.replace(
    "https://accounts.spotify.com/authorize?" +
      "client_id=" +
      client_id +
      "&response_type=" +
      "token" +
      "&redirect_uri=" +
      redirect_uri +
      "&show_dialog=" +
      "true" +
      "&scope=" +
      scope
  );

  return (
    <div className="login-container">
      <h1>Login to Spotify</h1>
    </div>
  );
};

export default Login;
