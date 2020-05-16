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
			expect(k.dump()).toEqual('_npx:1c,2,3,4t,"perl-brace-format"');
		});
	});
});
