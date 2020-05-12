import { Reference } from './reference';

describe('reference', () => {
	describe('constructor', () => {
		it('should accept filename and line number', () => {
			expect(new Reference('bravo.js', 2304)).toBeDefined();
		});
	});

	describe('toString()', () => {
		it('should serialize', () => {
			const ref = new Reference('bravo.js', 2304);

			expect(ref.toString()).toEqual('bravo.js:2304');
		});

		it('should escape newlines', () => {
			const ref = new Reference('two\nlines.js', 2304);

			expect(ref.toString()).toEqual('two\\nlines.js:2304');
		});
	});
});
