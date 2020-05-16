import { Catalog } from '../pot/catalog';
import { Parser } from './parser';

class DummyParser extends Parser {
	parse(_input: Buffer, _filename: string): Catalog {
		return null;
	}
}

describe('parser', () => {
	describe('dummy parser', () => {
		it('should throw an exception on non-existing files', () => {
			const p = new DummyParser();

			expect(() => p.parseFile('not-there.ts')).toThrow();
		});
	});
});
