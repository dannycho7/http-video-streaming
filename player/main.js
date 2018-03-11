const Queue = require("./queue");
const ManifestParser = require("./manifest-parser");
const { calculateByteRangeEnd, createByteRangeString } = require("./util");

const video_id = "seyeon"; // hardcoded for now

class Player {
	constructor(video_id) {
		this.mse = new (window.MediaSource || window.WebKitMediaSource());
		this.video_id = video_id;
		this.audioQueue = new Queue();
		this.videoQueue = new Queue();

		this.videoMediaIndex = 0;
		this.videoQualityIndex = 0;

		this.mse.addEventListener("sourceopen", this.init.bind(this));
	}

	get objectUrl() {
		return URL.createObjectURL(this.mse);
	}

	appendBufFromQueue(srcBuffer, queue) {
		queue.pipingToSourceBuffer = true;
		let buf = queue.popFirst();

		return Boolean(buf) && (srcBuffer.appendBuffer(buf) || true);
	}

	readData(reader, bufferQueue, sourceBuffer, callback = () => {}) {
		reader.read()
		.then((buffer) => {
			bufferQueue.push(buffer.value);
			if(!bufferQueue.pipingToSourceBuffer) {
				console.log("called: ", sourceBuffer, bufferQueue.pipingToSourceBuffer);
				this.appendBufFromQueue(sourceBuffer, bufferQueue);
			}

			if(!buffer.done) {
				this.readData(...arguments);
			} else {
				callback();
			}
		});
	}

	init() {
		(new ManifestParser(this.video_id)).getJSONManifest()
		.then((adaptSetsObj) => {
			this.videoSets = adaptSetsObj["video/webm"];
			this.audioSets = adaptSetsObj["audio/webm"];
			console.log(this.videoSets);

			this.videoQualityIndex = this.videoSets.representations.length - 1;

			this.videoSourceBuffer = this.mse.addSourceBuffer(`video/webm; codecs="${this.videoSets["codecs"]}"`);
			this.audioSourceBuffer = this.mse.addSourceBuffer(`audio/webm; codecs="${this.audioSets["codecs"]}"`);

			this.videoSourceBuffer.addEventListener("updateend", () => {
				if(!this.appendBufFromQueue(this.videoSourceBuffer, this.videoQueue)) this.videoQueue.pipingToSourceBuffer = false;
			});

			this.audioSourceBuffer.addEventListener("updateend", () => {
				if(!this.appendBufFromQueue(this.audioSourceBuffer, this.audioQueue)) this.audioQueue.pipingToSourceBuffer = false;
			});

			this.fetchData();
		});
	}

	fetchData() {
		this.fetchVideoAdaptive();
		this.fetchAudio();
	}

	fetchVideoAdaptive() {
		this.fetchVideoInit()
		.then(() => {
			this.fetchVideoNextTimeSlice();
		});
	}

	fetchVideoNextTimeSlice() {
		let videoRepresentation = this.videoSets["representations"][this.videoQualityIndex];
		let { timestamp_info } = videoRepresentation;

		if (this.videoMediaIndex < timestamp_info["media"].length) {
			fetch(videoRepresentation["url"], {
				headers: {
					range: `bytes=${createByteRangeString(timestamp_info["media"][this.videoMediaIndex])}`
				}
			})
			.then((response) => {
				var reader = response.body.getReader();
				this.readData(reader, this.videoQueue, this.videoSourceBuffer, () => {
					this.videoMediaIndex++;
					this.fetchVideoNextTimeSlice();
				});
			});
		}
	}

	// fetches initial video (webm headers + initial 5 seconds)
	fetchVideoInit() {
		let videoRepresentation = this.videoSets["representations"][this.videoQualityIndex];
		let { timestamp_info } = videoRepresentation;

		return new Promise((resolveFetchVideoInit, rejectFetchVideoInit) => {
			fetch(videoRepresentation["url"], {
				headers: {
					range: `bytes=0-${this._calculateByteRangeEnd(timestamp_info["media"][this.videoMediaIndex])}`
				}
			})
			.then((response) => {
				var reader = response.body.getReader();

				this.readData(reader, this.videoQueue, this.videoSourceBuffer, () => {
					this.videoMediaIndex++;
					return resolveFetchVideoInit();
				});
			});
		});
	}

	fetchAudio() {
		fetch(this.audioSets["representations"][0]["url"], {
			headers: {
				range: "bytes=0-"
			}
		})
		.then((response) => {
			var reader = response.body.getReader();
			this.readData(reader, this.audioQueue, this.audioSourceBuffer);
		});
	}

	_byteRangeString({ offset, size }) {
		return `${offset}-${this._calculateByteRangeEnd(...arguments)}`;
	}

	_calculateByteRangeEnd({ offset, size }) {
		return size + offset - 1;
	}
};

const player = new Player(video_id);

const playerElement = document.getElementById("videoPlayer");
playerElement.addEventListener("error", (err) => console.log(err));
playerElement.src = player.objectUrl;