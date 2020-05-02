import { DataViewlet } from './data-viewlet';

// This string has 34 bytes.
const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß';
const uint8array = new TextEncoder().encode(abc);
const dv = new DataViewlet(uint8array);

describe('bufferling', () => {
	describe('binary', () => {
		it('big-endian at offset 0', () => {
			expect(dv.readUint32BE()).toEqual(0x41424344);
		});
		it('little-endian at offset 0', () => {
			expect(dv.readUint32LE()).toEqual(0x44434241);
		});
		it('big-endian without overflow', () => {
			expect(dv.readUint32BE(26)).toEqual(0xc384c396);
		});
		it('little-endian without overflow', () => {
			expect(dv.readUint32LE(26)).toEqual(0x96c384c3);
		});
		it('big-endian at end of buffer', () => {
			expect(dv.readUint32BE(30)).toEqual(0xc39cc39f);
		});
		it('little-endian at end of buffer', () => {
			expect(dv.readUint32LE(30)).toEqual(0x9fc39cc3);
		});
		it('big-endian past end of buffer', () => {
			expect(() => dv.readUint32BE(31)).toThrow();
		});
		it('little-endian past end of buffer', () => {
			expect(() => dv.readUint32LE(31)).toThrow();
		});
	});
});