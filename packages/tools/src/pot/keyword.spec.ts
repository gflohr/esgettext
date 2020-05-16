import { Keyword } from './keyword';

describe('keywords', () => {
	describe('constructor', () => {
		it('should recognize all tokens', () => {
			const k = new Keyword('npgettext', ['1c', '2', '3', '3t']);
			expect(k.dump()).toEqual('npgettext:1c,2,3,3t');
		});
	});
});
