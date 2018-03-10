class Queue {
	constructor() {
		this.data = [];
		this.pipingToSourceBuffer = false;
	}

	push(el) {
		this.data.push(el)
	}

	popFirst() {
		let buf = this.data[0];
		this.data.shift();
		return buf;
	}
}

module.exports = Queue;