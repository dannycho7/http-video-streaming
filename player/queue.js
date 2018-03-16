class Queue {
	constructor() {
		this.data = [];
		this.pipingToSourceBuffer = false;
		this.numBytesWrittenInSegment = 0;
	}

	push(buf) {
		if (!buf) {
			throw new Error("Cannot push falsey values to queue");
		}

		this.data.push(buf);
		this.numBytesWrittenInSegment += buf.length
	}

	resetByteCounter() {
		this.numBytesWrittenInSegment = 0;
	}

	empty() {
		return this.data.length === 0;
	}

	popFirst() {
		let buf = this.data[0];
		this.data.shift();
		return buf;
	}
}

module.exports = Queue;