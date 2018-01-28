const fs = require("fs");
const express = require("express");
const app = express();

app.use(express.static(__dirname));

app.get("/video", (req, res) => {
	fs.createReadStream("./video.mp4").pipe(res);
});

app.listen(5000, () => console.log("Server listening in on port 5000"));