/**
 * A minimalistic buffer implementation that can only read 32 bit unsigned
 * integers and strings.
 */
export class DataViewlet {
	constructor(private readonly array: Uint8Array) {}

	/**
	 * Reads an unsigned 32-bit integer from the buffer at
	 * the specified offset as big-endian.
	 *
	 * @param offset - Number of bytes to skip before starting to read.
	 *                 Must satisfy `0 <= offset <= buf.length - 4`.
	 *                 Default: 0.
	 * @returns - the 32-bit unsigned integer at position `offset`.s
	 */
	readUint32BE(offset = 0): number {
		if (offset + 4 > this.array.byteLength + this.array.byteOffset) {
			throw new Error('read past array end');
		}

		return (
			((this.array[offset] << 24) >>> 0) |
			(this.array[offset + 1] << 16) |
			(this.array[offset + 2] << 8) |
			this.array[offset + 3]
		);
	}

	/**
	 * Reads an unsigned 32-bit integer from the buffer at
	 * the specified offset as little-endian.
	 *
	 * @param offset - Number of bytes to skip before starting to read.
	 *                 Must satisfy `0 <= offset <= buf.length - 4`.
	 *                 Default: 0.
	 * @returns - the 32-bit unsigned integer at position `offset`.s
	 */
	readUint32LE(offset = 0): number {
		if (offset + 4 > this.array.byteLength + this.array.byteOffset) {
			throw new Error('read past array end');
		}

		return (
			((this.array[offset + 3] << 24) >>> 0) |
			(this.array[offset + 2] << 16) |
			(this.array[offset + 1] << 8) |
			this.array[offset]
		);
	}
}
