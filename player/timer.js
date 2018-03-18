class Timer {
	constructor() {
		this.startTime = null;
		this.endTime = null;
		this.videoDuration = null;
	}

	start() {
		this.startTime = Date.now();
	}

	end() {
		this.endTime = Date.now();
	}

	setVideoDuration(videoDuration) {
		this.videoDuration = videoDuration;
	}

	get timeElapsed() {
		return (this.endTime - this.startTime) / 1000;
	}

	get lagRatio() {
		return (this.timeElapsed - this.videoDuration) / this.videoDuration;
	}
}

module.exports = Timer;