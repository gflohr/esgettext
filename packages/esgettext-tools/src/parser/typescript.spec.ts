import { Catalog } from '../pot/catalog';
import { TypeScriptParser } from './typescript';

describe('TypeScript parser', () => {
	describe('strings', () => {
		it('should parse a simple call', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new TypeScriptParser(catalog, warner);
			const code = 'gtx._("Hello, world!")';
			expect(p.parse(Buffer.from(code), 'example.ts')).toBeTruthy();
			const expected = `#: example.ts:1
msgid "Hello, world!"
msgstr ""
`;
			expect(catalog.toString()).toEqual(expected);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should parse itself', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new TypeScriptParser(catalog, warner);
			const filename = __filename.replace(/typescript\.spec\.ts$/, 'parser.ts');
			expect(p.parseFile(filename)).toBeTruthy();
			expect(catalog.toString()).toMatchSnapshot();
		});

		it('should parse itself with encoding', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new TypeScriptParser(catalog, warner);
			const filename = __filename.replace(/typescript\.spec\.ts$/, 'parser.ts');
			expect(p.parseFile(filename, 'utf-8')).toBeTruthy();
			expect(catalog.toString()).toMatchSnapshot();
		});
	});
});
