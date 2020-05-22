import { Catalog } from '../pot/catalog';
import { Parser } from './parser';

class DummyParser extends Parser {
	parse(_input: Buffer, _filename: string): boolean {
		return false;
	}
}

describe('parser', () => {
	describe('dummy parser', () => {
		it('should report i/o errors', () => {
			const warner = jest.fn();
			const catalog = new Catalog();
			const p = new DummyParser(catalog, warner);

			expect(p.parseFile('not-there.ts')).toBeFalsy();
			expect(warner).toHaveBeenCalledTimes(1);
		});
	});
});