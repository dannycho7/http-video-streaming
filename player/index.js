const Player = require("./player");
const Timer = require("./timer");

const playerElement = document.getElementById("videoPlayer");
const video_id = playerElement.getAttribute("data-player-id");

const player = new Player(video_id);

playerElement.src = player.objectUrl;
playerElement.addEventListener("error", (err) => console.log(err));

let timer = new Timer(playerElement.duration);

playerElement.addEventListener("play", () => {
	timer.start();
});

playerElement.addEventListener("ended", () => {
	timer.end();
	timer.setVideoDuration(playerElement.duration);
	console.log("Lag Ratio: " + timer.lagRatio);
});
