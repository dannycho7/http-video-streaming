const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;

app.use((req, res, next) => {
	console.log("Request: ", req.url);
	console.log("Received request w/ headers:", req.headers);
	next();
});

app.use(express.static(path.join(__dirname, "..", "public")));

const resolve_file_path = (video_id, filename) => path.join(__dirname, "..", "videos", video_id, filename);
const resolve_content_type = (filename) => filename === "audio.webm" ? "audio/webm" : "video/webm";

app.get("/watch/:video_id/manifest.mpd", (req, res) => {
	res.sendFile(resolve_file_path(req.params["video_id"], "manifest.mpd"));
});

app.get("/watch/:video_id/timestamps/:filename", (req, res) => {
	res.sendFile(resolve_file_path(req.params["video_id"], `timestamps/${req.params["filename"]}`));
});

app.get("/watch/:video_id/:filename", (req, res) => {
	let file_path = resolve_file_path(req.params["video_id"], req.params["filename"]);

	let { size: fileSize } = fs.statSync(file_path);

	const parts = req.headers.range.replace(/bytes=/, "").split("-");
	const start = parseInt(parts[0], 10);
	const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;

	let chunkSize = end - start + 1;
	let head = {
		"Transfer-Encoding": "chunked",
		"Content-Range": `bytes ${start}-${end}/${fileSize}`,
		"Accept-Ranges": "bytes",
		"Content-Length": chunkSize,
		"Content-Type": resolve_content_type(req.params.filename)
	};
	res.writeHead(206, head);

	fs.createReadStream(file_path, { start, end }).pipe(res);
});

app.listen(PORT, () => console.log(`Server listening in on port ${PORT}`));