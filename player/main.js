const Queue = require("./queue");
const ManifestParser = require("./manifest-parser");

const video_id = "seyeon"; // hardcoded for now

function appendBufFromQueue(srcBuffer, queue) {
	queue.pipingToSourceBuffer = true;
	let buf = queue.popFirst();

	return Boolean(buf) && (srcBuffer.appendBuffer(buf) || true);
}

function readData(reader, bufferQueue, sourceBuffer) {
	reader.read()
	.then((buffer) => {
		bufferQueue.push(buffer.value);
		if(!bufferQueue.pipingToSourceBuffer) {
			console.log("called: ", sourceBuffer, bufferQueue.pipingToSourceBuffer);
			appendBufFromQueue(sourceBuffer, bufferQueue);
		}

		if(!buffer.done) readData(...arguments);
	});
}

var player = document.getElementById("videoPlayer");

player.addEventListener("error", (err) => console.log(err));

var mse = new (window.MediaSource || window.WebKitMediaSource());
window.mse = mse;

mse.addEventListener("sourceopen", function (evt) {
	console.log("Source opened", this);

	(new ManifestParser(video_id)).getJSONManifest()
	.then((adaptSetsObj) => {
		console.log(adaptSetsObj);		

		var videoSourceBuffer = this.addSourceBuffer(`video/webm; codecs="${adaptSetsObj["video/webm"]["codecs"]}"`);
		var audioSourceBuffer = this.addSourceBuffer(`audio/webm; codecs="${adaptSetsObj["audio/webm"]["codecs"]}"`)

		let audioQueue = new Queue();
		let videoQueue = new Queue();

		videoSourceBuffer.addEventListener("updateend", function() {
			if(!appendBufFromQueue(this, videoQueue)) videoQueue.pipingToSourceBuffer = false;
		});

		audioSourceBuffer.addEventListener("updateend", function() {
			if(!appendBufFromQueue(this, audioQueue)) audioQueue.pipingToSourceBuffer = false;
		});

		fetch("/seyeon/160x90_250k.webm", {
			headers: {
				range: "0-108060"
			}
		})
		.then((response) => {
			var reader = response.body.getReader();
			readData(reader, videoQueue, videoSourceBuffer);
		});

		setTimeout(() => {
			fetch("/seyeon/640x360_750k.webm", {
				headers: {
					range: "369427-730406"
				}
			})
			.then((response) => {
				var reader = response.body.getReader();
				readData(reader, videoQueue, videoSourceBuffer);
			});
		}, 2000);

		fetch(adaptSetsObj["audio/webm"]["representations"][0]["url"], {
			headers: {
				range: "0-"
			}
		})
		.then((response) => {
			var reader = response.body.getReader();
			readData(reader, audioQueue, audioSourceBuffer);
		});
	});
});

player.src = URL.createObjectURL(mse);