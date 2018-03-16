// Hosts general functions that don't necessarily have ties to a bigger class or entity

const calculateByteRangeEnd = ({ offset, size }) => {
	return size + offset - 1;
}

const createByteRangeString = (numBytesWrittenInSegment, { offset, size }) => {
	return `${numBytesWrittenInSegment + offset}-${calculateByteRangeEnd({ offset, size })}`;
}

class RetryTimer {
	constructor() {
		this.time = 250;
		this.limit = 10000;
	}

	increase() {
		this.time = Math.min(2 * this.time, this.limit);
	}

	reset() {
		this.time = 250;
	}
}

module.exports.calculateByteRangeEnd = calculateByteRangeEnd;
module.exports.createByteRangeString = createByteRangeString;
module.exports.RetryTimer = RetryTimer;