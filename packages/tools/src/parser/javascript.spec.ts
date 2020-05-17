import { JavaScriptParser } from './javascript';

describe('JavaScript parser', () => {
	describe('simple code', () => {
		it('should create an empty catalog', () => {
			const warner = jest.fn();
			const p = new JavaScriptParser(warner);

			const code = '';
			const input = Buffer.from(code);

			expect(p.parse(input, 'example.ts').toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should parse one single call', () => {
			const warner = jest.fn();
			const p = new JavaScriptParser(warner);

			const code = 'gtx._("Hello, world!")';
			const input = Buffer.from(code);
			p.parse(input, 'example.ts').toString();
			expect(warner).not.toHaveBeenCalled();
		});
	});
});
