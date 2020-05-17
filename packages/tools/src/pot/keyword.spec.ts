import { Keyword } from './keyword';

describe('keywords', () => {
	describe('constructor', () => {
		it('should recognize the simplest form', () => {
			const k = new Keyword('_');
			expect(k.toString()).toEqual('_');
		});

		it('should consider an empty token as 1', () => {
			const k = new Keyword('_', ['']);
			expect(k.toString()).toEqual('_');
		});

		it('should recognize all tokens', () => {
			const k = new Keyword('_npx', [
				'1c',
				'2',
				'3',
				'4t',
				'"perl-brace-format"',
			]);
			expect(k.toString()).toEqual('_npx:1c,2,3,4t,"perl-brace-format"');
		});

		it('should detect conflicting form specs', () => {
			expect(() => new Keyword('_', ['1c', '1'])).toThrow(
				new Error('Multiple meanings for argument #1 for function "_"!'),
			);
		});
	});

	describe('from string', () => {
		it('should recognize all tokens', () => {
			const arg = '_npx:1c,2,3,4t,"perl-brace-format"';
			expect(Keyword.from(arg).toString()).toEqual(arg);
		});
	});
});
