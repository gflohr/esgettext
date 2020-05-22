/*
 * A minimalistic buffer implementation that can only read 32 bit unsigned
 * integers and strings.
 */
export class DataViewlet {
	private decoder: TextDecoder;
	private _encoding: string;

	/*
	 * Create a DataViewlet instance. All encodings that are supported by
	 * the runtime environments `TextDecoder` interface.
	 *
	 * @param array - a `Unit8Array` view on the binary buffer
	 * @param encoding - encoding of strings, defaults to utf-8
	 */
	constructor(private readonly array: Uint8Array, encoding = 'utf-8') {
		this.decoder = new TextDecoder(encoding);
		this._encoding = encoding;
	}

	/**
	 * Get the encoding for strings.
	 *
	 * @returns the encoding in use
	 */
	get encoding(): string {
		return this._encoding;
	}

	/**
	 * Switch to a new encoding.
	 *
	 * @param encoding - new encoding to use
	 */
	set encoding(encoding: string) {
		this.decoder = new TextDecoder(encoding);
		this._encoding = encoding;
	}
	/*
	 * Reads an unsigned 32-bit integer from the buffer at
	 * the specified offset as big-endian.
	 *
	 * @param offset - Number of bytes to skip before starting to read.
	 *                 Must satisfy `0 <= offset <= buf.length - 4`.
	 *                 Default: 0.
	 * @returns the 32-bit unsigned integer at position `offset`.s
	 */
	readUInt32BE(offset = 0): number {
		if (offset + 4 > this.array.byteLength + this.array.byteOffset) {
			throw new Error('read past array end');
		}

		return (
			(((this.array[offset] << 24) >>> 0) |
				(this.array[offset + 1] << 16) |
				(this.array[offset + 2] << 8) |
				this.array[offset + 3]) >>>
			0
		);
	}

	/*
	 * Reads an unsigned 32-bit integer from the buffer at
	 * the specified offset as little-endian.
	 *
	 * @param offset - Number of bytes to skip before starting to read.
	 *                 Must satisfy `0 <= offset <= buf.length - 4`.
	 *                 Default: 0.
	 * @returns the 32-bit unsigned integer at position `offset`.s
	 */
	readUInt32LE(offset = 0): number {
		if (offset + 4 > this.array.byteLength + this.array.byteOffset) {
			throw new Error('read past array end');
		}

		return (
			(((this.array[offset + 3] << 24) >>> 0) |
				(this.array[offset + 2] << 16) |
				(this.array[offset + 1] << 8) |
				this.array[offset]) >>>
			0
		);
	}

	/*
	 * Read a string at a specified offset.
	 *
	 * @param offset - to beginning of buffer in bytes
	 * @param length - of the string to read in bytes or to the end of the
	 *                 buffer if not specified.
	 */
	readString(offset = 0, length?: number): string {
		if (offset + length > this.array.byteLength + this.array.byteOffset) {
			throw new Error('read past array end');
		}

		if (typeof length === 'undefined') {
			length = this.array.byteLength - offset;
		}

		return this.decoder.decode(this.array.slice(offset, offset + length));
	}
}
