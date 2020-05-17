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
			const warner = jest.fn();
			const catalog = new Catalog();
			const p = new DummyParser(catalog, warner);

			expect(() => p.parseFile('not-there.ts')).toThrow();
		});
	});
});
