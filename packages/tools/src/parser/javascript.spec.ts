import { JavaScriptParser } from './javascript';

describe('JavaScript parser', () => {
	describe('simple code', () => {
		it('should create an empty catalog', () => {
			const warner = jest.fn();
			const p = new JavaScriptParser(warner);

			const code = '';
			const input = Buffer.from(code);

			expect(p.parse(input, 'example.ts').toString()).toEqual('');
		});
	});
});
