import { DataViewlet } from './data-viewlet';

// This string has 34 bytes.
const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß';
const uint8Array = new TextEncoder().encode(abc);

describe('bufferling', () => {
	describe('binary', () => {
		const dv = new DataViewlet(uint8Array);

		it('big-endian at offset 0', () => {
			expect(dv.readUInt32BE()).toEqual(0x41424344);
		});
		it('little-endian at offset 0', () => {
			expect(dv.readUInt32LE()).toEqual(0x44434241);
		});
		it('big-endian without overflow', () => {
			expect(dv.readUInt32BE(26)).toEqual(0xc384c396);
		});
		it('little-endian without overflow', () => {
			expect(dv.readUInt32LE(26)).toEqual(0x96c384c3);
		});
		it('big-endian at end of buffer', () => {
			expect(dv.readUInt32BE(30)).toEqual(0xc39cc39f);
		});
		it('little-endian at end of buffer', () => {
			expect(dv.readUInt32LE(30)).toEqual(0x9fc39cc3);
		});
		it('big-endian past end of buffer', () => {
			expect(() => dv.readUInt32BE(31)).toThrow();
		});
		it('little-endian past end of buffer', () => {
			expect(() => dv.readUInt32LE(31)).toThrow();
		});
	});

	describe('utf-8 text', () => {
		const dv = new DataViewlet(uint8Array);

		it('at offset 0', () => {
			expect(dv.readString(undefined, 4)).toEqual('ABCD');
		});
		it('utf-8 string', () => {
			expect(dv.readString(26, 8)).toEqual('ÄÖÜß');
		});
		it('utf-8 string to end of buffer', () => {
			expect(dv.readString(26)).toEqual('ÄÖÜß');
		});
		it('past end of buffer', () => {
			expect(() => dv.readString(30, 5)).toThrow();
		});
	});

	describe('windows-1252 text', () => {
		const dv = new DataViewlet(uint8Array, 'windows-1252');

		it('at offset 0', () => {
			expect(dv.readString(undefined, 4)).toEqual('ABCD');
		});
		it('utf-8 string (decoded as windows-1252, code points)', () => {
			const s = dv.readString(26, 8);

			const codes: number[] = [];
			for (let i = 0; i < s.length; i++) {
				codes.push(s.charCodeAt(i));
			}

			expect(codes).toEqual([
				0x00c3, 0x0084, 0x00c3, 0x0096, 0x00c3, 0x009c, 0x00c3, 0x009f,
			]);
		});
		it('past end of buffer', () => {
			expect(() => dv.readString(30, 5)).toThrow();
		});
	});
});
