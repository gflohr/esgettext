import { Catalog } from '../pot/catalog';
import { Parser } from './parser';

class DummyParser extends Parser {
	parse(_input: Buffer, _filename: string): boolean {
		return false;
	}
}

const warnSpy = jest.spyOn(global.console, 'warn').mockImplementation(() => {
	/* ignore */
});
const errorSpy = jest.spyOn(global.console, 'error').mockImplementation(() => {
	/* ignore */
});

describe('parser', () => {
	describe('dummy parser', () => {
		it('should report i/o errors', () => {
			const catalog = new Catalog();
			const p = new DummyParser(catalog);

			expect(p.parseFile('not-there.ts')).toBeFalsy();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy).not.toHaveBeenCalled();
		});
	});
});
