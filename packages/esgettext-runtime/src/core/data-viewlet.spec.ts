import { DataViewlet } from './data-viewlet';

const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß';
const uint8array = new TextEncoder().encode(abc);
const dv = new DataViewlet(uint8array);

describe('bufferling', () => {
	describe('binary', () => {
		it('big-endian at offset 0', () => {
			expect(dv.readUint32BE(0)).toEqual(0x41424344);
		});
	});
});
