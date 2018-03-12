class Queue {
	constructor() {
		this.data = [];
		this.pipingToSourceBuffer = false;
	}

	push(el) {
		if (!el) {
			throw new Error("Cannot push falsey values to queue");
		}

		this.data.push(el);
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