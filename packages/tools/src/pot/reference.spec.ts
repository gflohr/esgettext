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

	describe('compare()', () => {
		it('should collate by filename first', () => {
			const that = new Reference('november.js', 2304);

			const before = new Array<Reference>();
			before.push(new Reference('alpha.js', 2304));
			before.push(new Reference('bravo.js', 2304));
			before.push(new Reference('charlie.js', 2304));
			before.push(new Reference('delta.js', 2304));
			before.push(new Reference('echo.js', 2304));
			before.push(new Reference('foxtrot.js', 2304));
			before.push(new Reference('golf.js', 2304));
			before.push(new Reference('hotel.js', 2304));
			before.push(new Reference('india.js', 2304));
			before.push(new Reference('juliet.js', 2304));
			before.push(new Reference('kilo.js', 2304));
			before.push(new Reference('lima.js', 2304));
			before.push(new Reference('mike.js', 2304));

			before.forEach((other) => {
				expect(that.compare(other)).toBeGreaterThan(0);
			});

			const equal = new Reference('november.js', 2304);
			expect(that.compare(equal)).toEqual(0);

			const after = new Array<Reference>();
			after.push(new Reference('oscar.js', 2304));
			after.push(new Reference('papa.js', 2304));
			after.push(new Reference('quebec.js', 2304));
			after.push(new Reference('romeo.js', 2304));
			after.push(new Reference('sierra.js', 2304));
			after.push(new Reference('tango.js', 2304));
			after.push(new Reference('uniform.js', 2304));
			after.push(new Reference('victor.js', 2304));
			after.push(new Reference('whiskey.js', 2304));
			after.push(new Reference('xray.js', 2304));
			after.push(new Reference('yankee.js', 2304));
			after.push(new Reference('zulu.js', 2304));

			after.forEach((other) => {
				const ref = new Reference('november.js', 2304);
				expect(ref.compare(other)).toBeLessThan(0);
			});
		});

		it('should also compare line numbers', () => {
			const that = new Reference('source.js', 10);

			const before = new Array<Reference>();
			before.push(new Reference('source.js', 1));
			before.push(new Reference('source.js', 2));
			before.push(new Reference('source.js', 3));
			before.push(new Reference('source.js', 4));
			before.push(new Reference('source.js', 5));
			before.push(new Reference('source.js', 6));
			before.push(new Reference('source.js', 7));
			before.push(new Reference('source.js', 8));
			before.push(new Reference('source.js', 9));

			before.forEach((other) => {
				expect(that.compare(other)).toBeGreaterThan(0);
			});

			const equal = new Reference('source.js', 10);
			expect(that.compare(equal)).toEqual(0);

			const after = new Array<Reference>();
			after.push(new Reference('source.js', 11));
			after.push(new Reference('source.js', 12));
			after.push(new Reference('source.js', 13));
			after.push(new Reference('source.js', 14));
			after.push(new Reference('source.js', 15));
			after.push(new Reference('source.js', 16));
			after.push(new Reference('source.js', 17));
			after.push(new Reference('source.js', 18));
			after.push(new Reference('source.js', 19));

			after.forEach((other) => {
				expect(that.compare(other)).toBeLessThan(0);
			});
		});
	});
});
