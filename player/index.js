const Player = require("./player");

const playerElement = document.getElementById("videoPlayer");
const video_id = playerElement.getAttribute("data-player-id");

const player = new Player(video_id);

playerElement.src = player.objectUrl;
playerElement.addEventListener("error", (err) => console.log(err));
