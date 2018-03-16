const Queue = require("./queue");
const ManifestParser = require("./manifest-parser");
const { calculateByteRangeEnd, createByteRangeString } = require("./util");

class Player {
	constructor(video_id) {
		this.mse = new (window.MediaSource || window.WebKitMediaSource());
		this.video_id = video_id;
		this.initialized = false;
		this.audioQueue = new Queue();
		this.videoQueue = new Queue();

		this.videoMediaIndex = 0;
		this.videoQualityIndex = 0;
		this.videoBytesInSourceBuffer = 0;

		this.mse.addEventListener("sourceopen", () => {
			console.log("Source Opened");
			this.init.bind(this)();
		});
	}

	get objectUrl() {
		return URL.createObjectURL(this.mse);
	}

	appendBufFromQueue(srcBuffer, queue) {
		queue.pipingToSourceBuffer = true;

		return !queue.empty() && (srcBuffer.appendBuffer(queue.popFirst()) || true);
	}

	readData(reader, bufferQueue, sourceBuffer, callback = () => {}) {
		reader.read()
		.then((buffer) => {
			if (buffer.value) {
				bufferQueue.push(buffer.value);
				if(!bufferQueue.pipingToSourceBuffer) {
					console.log("called: ", sourceBuffer, bufferQueue.pipingToSourceBuffer);
					this.appendBufFromQueue(sourceBuffer, bufferQueue);
				}	
			}

			if(!buffer.done) {
				this.readData(...arguments);
			} else {
				callback();
			}
		})
		.catch((err) => callback(err));
	}

	init() {
		if (this.initialized) return;
		this.initialized = true;

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
		})
		.catch((err) => {
			console.log(`Error thrown in init: ${err}`);
			this.retryRequest(this.fetchVideoAdaptive.bind(this));
		});
	}

	fetchVideoNextTimeSlice() {
		let videoRepresentation = this.videoSets["representations"][this.videoQualityIndex];
		let { timestamp_info } = videoRepresentation;

		if (this.videoMediaIndex < timestamp_info["media"].length) {
			this._throttleQualityOnFeedback((finish) => {
				fetch(videoRepresentation["url"], {
					headers: {
						range: `bytes=${createByteRangeString(this.videoQueue.numBytesWrittenInSegment, timestamp_info["media"][this.videoMediaIndex])}`
					}
				})
				.then((response) => {
					let reader = response.body.getReader();
					let bindedFetch = this.fetchVideoNextTimeSlice.bind(this);
					let handleReadData = this.handleReadDataFinish(finish, bindedFetch, () => this.retryRequest(bindedFetch));

					this.readData(reader, this.videoQueue, this.videoSourceBuffer, handleReadData);
				})
				.catch((err) => {
					this.retryRequest(this.fetchVideoNextTimeSlice.bind(this));
				});
			});
		}
	}

	// fetches initial video (webm headers + initial 5 seconds)
	fetchVideoInit() {
		let videoRepresentation = this.videoSets["representations"][this.videoQualityIndex];
		let { timestamp_info } = videoRepresentation;

		return new Promise((resolveFetchVideoInit, rejectFetchVideoInit) => {
			this._throttleQualityOnFeedback((finish) => {
				fetch(videoRepresentation["url"], {
					headers: {
						range: `bytes=${this.videoQueue.numBytesWrittenInSegment}-${calculateByteRangeEnd(timestamp_info["media"][this.videoMediaIndex])}`
					}
				})
				.then((response) => {
					let reader = response.body.getReader();
					let handleReadData = this.handleReadDataFinish(finish, resolveFetchVideoInit, rejectFetchVideoInit);

					this.readData(reader, this.videoQueue, this.videoSourceBuffer, handleReadData);
				})
				.catch((err) => {
					console.log(`Error in fetchVideoInit promise ${err}`);
					rejectFetchVideoInit(new Error("Propagate up"));
				});
			});
		});
	}

	fetchAudio() {
		fetch(this.audioSets["representations"][0]["url"], {
			headers: {
				range: `bytes=${this.audioQueue.numBytesWrittenInSegment}-`
			}
		})
		.then((response) => {
			var reader = response.body.getReader();
			this.readData(reader, this.audioQueue, this.audioSourceBuffer, (err) => {
				if (err) return this.fetchAudio();
			});
		})
		.catch((err) => {
			this.retryRequest(this.fetchAudio.bind(this));
		});
	}

	handleReadDataFinish(finishForThrottle, nextAction, retryRequestCall) {
		return (err) => {
			if (err) {
				console.log("Retrying in video init");
				return retryRequestCall();
			}

			this.videoMediaIndex++;
			this.videoQueue.resetByteCounter();
			finishForThrottle();
			nextAction();
		}
	}

	retryRequest(requestCall) {
		setTimeout(requestCall, 1000);
	}

	// Improves quality (if possible) if time to fetch information < 50% of buffer duration decreases (if possible) if greater than 75%
	_throttleQualityOnFeedback(fetchCall) {
		let bufferDuration = this._calcDuration();
		let startTime = Date.now();
		fetchCall(() => {
			let endTime = Date.now();

			console.log(`Time elapsed: ${endTime - startTime} and bufferDuration = ${bufferDuration}`);
			let fetchDuration = endTime - startTime;
			let maxQualityIndex = this.videoSets["representations"].length - 1;
			let lowestQualityIndex = 0;

			if (fetchDuration < 0.5 * bufferDuration && this.videoQualityIndex !== maxQualityIndex) {
				this.videoQualityIndex++;
				console.log("Incremented Quality index");
			}

			if (fetchDuration > 0.75 * bufferDuration && this.videoQualityIndex !== lowestQualityIndex) {
				this.videoQualityIndex--;
				console.log("Decremented Quality index");
			}
		});
	}

	_calcDuration() {
		let videoRepresentation = this.videoSets["representations"][this.videoQualityIndex];
		let { timestamp_info } = videoRepresentation;
		let startTimeCode = timestamp_info["media"][this.videoMediaIndex]["timecode"];

		if (this.videoMediaIndex === timestamp_info["media"].length - 1) {
			return timestamp_info["duration"] - (1000 * startTimeCode);
		} else {
			let nextTimeCode = timestamp_info["media"][this.videoMediaIndex + 1]["timecode"];
			return 1000 * (nextTimeCode - startTimeCode);
		}
	}
};

module.exports = Player;