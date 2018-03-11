// Hosts general functions that don't necessarily have ties to a bigger class or entity

const calculateByteRangeEnd = ({ offset, size }) => {
	return size + offset - 1;
}

const createByteRangeString = ({ offset, size }) => {
	return `${offset}-${calculateByteRangeEnd({ offset, size })}`;
}

module.exports.calculateByteRangeEnd = calculateByteRangeEnd;
module.exports.createByteRangeString = createByteRangeString;