import { Keyword } from './keyword';

describe('keywords', () => {
	describe('constructor', () => {
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
	});

	describe('from string', () => {
		it('should recognize all tokens', () => {
			const arg = '_npx:1c,2,3,4t,"perl-brace-format"';
			expect(Keyword.from(arg).toString()).toEqual(arg);
		});
	});
});
