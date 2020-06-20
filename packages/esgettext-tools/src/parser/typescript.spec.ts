import { Catalog } from '../pot/catalog';
import { Keyword } from '../pot/keyword';
import { TypeScriptParser } from './typescript';

const warnSpy = jest.spyOn(global.console, 'warn').mockImplementation(() => {
	/* ignore */
});
const errorSpy = jest.spyOn(global.console, 'error').mockImplementation(() => {
	/* ignore */
});

describe('TypeScript parser', () => {
	describe('strings', () => {
		afterEach(() => {
			warnSpy.mockClear();
			errorSpy.mockClear();
		});

		it('should parse a simple call', () => {
			const catalog = new Catalog();
			const p = new TypeScriptParser(catalog, {
				keyword: [new Keyword('_')],
			});
			const code = 'gtx._("Hello, world!")';
			expect(p.parse(Buffer.from(code), 'example.ts')).toBeTruthy();
			const expected = `#: example.ts:1
msgid "Hello, world!"
msgstr ""
`;
			expect(catalog.toString({ omitHeader: true })).toEqual(expected);
			expect(errorSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should parse a nested call', () => {
			const catalog = new Catalog();
			const p = new TypeScriptParser(catalog, {
				keyword: [new Keyword('_')],
				instance: ['some.thing.gtx'],
			});
			const code = 'some.thing.gtx._("Hello, world!")';
			expect(p.parse(Buffer.from(code), 'example.ts')).toBeTruthy();
			const expected = `#: example.ts:1
msgid "Hello, world!"
msgstr ""
`;
			expect(catalog.toString({ omitHeader: true })).toEqual(expected);
			expect(errorSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should parse a nested call with computed properties', () => {
			const catalog = new Catalog();
			const p = new TypeScriptParser(catalog, {
				keyword: [new Keyword('_')],
				instance: ['some.thing.gtx'],
			});
			const code = 'some["thing"].gtx["_"]("Hello, world!")';
			expect(p.parse(Buffer.from(code), 'example.ts')).toBeTruthy();
			const expected = `#: example.ts:1
msgid "Hello, world!"
msgstr ""
`;
			expect(catalog.toString({ omitHeader: true })).toEqual(expected);
			expect(errorSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should parse a nested call with computed properties and template literals', () => {
			const catalog = new Catalog();
			const p = new TypeScriptParser(catalog, {
				keyword: [new Keyword('_')],
				instance: ['some.thing.gtx'],
			});
			const code = 'some[`thing`].gtx[`_`]("Hello, world!")';
			expect(p.parse(Buffer.from(code), 'example.ts')).toBeTruthy();
			const expected = `#: example.ts:1
msgid "Hello, world!"
msgstr ""
`;
			expect(catalog.toString({ omitHeader: true })).toEqual(expected);
			expect(errorSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should reject a nested call with computed properties and non-constant template literals', () => {
			const catalog = new Catalog();
			const p = new TypeScriptParser(catalog, {
				keyword: [new Keyword('_')],
				instance: ['some.thing.gtx'],
			});
			const code = 'some[`${thing}`].gtx[`_`]("Hello, world!")';
			expect(p.parse(Buffer.from(code), 'example.ts')).toBeTruthy();
			expect(catalog.toString({ omitHeader: true })).toEqual('');
			expect(errorSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should reject wrong instances', () => {
			const catalog = new Catalog();
			const p = new TypeScriptParser(catalog, {
				keyword: [new Keyword('_')],
				instance: ['some.thing.else.gtx'],
			});
			const code = 'some.thing.gtx._("Hello, world!")';
			expect(p.parse(Buffer.from(code), 'example.ts')).toBeTruthy();
			expect(catalog.toString({ omitHeader: true })).toEqual('');
			expect(errorSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should accept a partially correct instance', () => {
			const catalog = new Catalog();
			const p = new TypeScriptParser(catalog, {
				keyword: [new Keyword('_')],
				instance: ['thing.gtx'],
			});
			const code = 'some.thing.gtx._("Hello, world!")';
			expect(p.parse(Buffer.from(code), 'example.ts')).toBeTruthy();
			const expected = `#: example.ts:1
msgid "Hello, world!"
msgstr ""
`;
			expect(catalog.toString({ omitHeader: true })).toEqual(expected);
			expect(errorSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
		});
	});
});
