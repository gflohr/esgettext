import { Parser } from './parser';

class DummyParser extends Parser {
	parse(_input: string): void {}
}

describe('parser', () => {
	describe('dummy parser', () => {
		it('should throw an exception on non-existing files', () => {
			const p = new DummyParser();

			expect(() => p.parseFile('not-there.ts', 'utf-8')).toThrow();
		});
	});
});
