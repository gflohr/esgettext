import { Catalog } from '../pot/catalog';
import { Keyword } from '../pot/keyword';
import { TypeScriptParser } from './typescript';

describe('TypeScript parser', () => {
	describe('strings', () => {
		it('should parse a simple call', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new TypeScriptParser(catalog, warner, {
				keywords: [new Keyword('_')],
			});
			const code = 'gtx._("Hello, world!")';
			expect(p.parse(Buffer.from(code), 'example.ts')).toBeTruthy();
			const expected = `#: example.ts:1
msgid "Hello, world!"
msgstr ""
`;
			expect(catalog.toString()).toEqual(expected);
			expect(warner).not.toHaveBeenCalled();
		});
	});
});
