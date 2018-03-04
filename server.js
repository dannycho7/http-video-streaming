const fs = require("fs");
const express = require("express");
const app = express();

app.use(express.static(__dirname));

const resolve_video_path_from_id = (video_id) => "./video.mp4"; // temporarily only one video

app.get("/video", (req, res) => {
	let video_path = resolve_video_path_from_id(req.query["v"]);

	let { size: fileSize } = fs.statSync(video_path);

	const parts = req.headers.range.replace(/bytes=/, "").split("-");
	const start = parseInt(parts[0], 10);
	const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;

	let chunkSize = end - start + 1;
	let head = {
		"Transfer-Encoding": "chunked",
		"Content-Range": `bytes ${start}-${end}/${fileSize}`,
		"Accept-Ranges": "bytes",
		"Content-Length": chunkSize,
		"Content-Type": "video/mp4"
	};
	res.writeHead(206, head);

	fs.createReadStream(video_path, { start, end }).pipe(res);
});

app.listen(5000, () => console.log("Server listening in on port 5000"));