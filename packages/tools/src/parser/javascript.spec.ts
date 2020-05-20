import { Catalog } from '../pot/catalog';
import { Keyword } from '../pot/keyword';
import { JavaScriptParser } from './javascript';

describe('JavaScript parser', () => {
	describe('strings', () => {
		it('should extract all kinds of strings', () => {
			const catalog = new Catalog({ noHeader: true, extractAll: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner);
			const code = `
// Directive.
_("double-quoted string");

// Function call.
_('single-quoted string');

// perl-brace-format.
_x('Hello, {name}!');
`;
			p.parse(Buffer.from(code), 'example.js');
			expect(catalog.toString()).toMatchSnapshot();
			expect(warner).not.toHaveBeenCalled();
		});

		it('should extract concatenated strings', () => {
			const catalog = new Catalog({ noHeader: true, extractAll: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner);
			const code = '"concatenated" + " str" + "i" + "n" + "g";';
			const buf = Buffer.from(code);
			p.parse(buf, 'example.js');
			const expected = `#: example.js:1
msgid "concatenated string"
msgstr ""
`;
			expect(catalog.toString()).toEqual(expected);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should not extract concatenated strings with a leading variable', () => {
			const catalog = new Catalog({ noHeader: true, extractAll: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner);
			const code = 'prefix + "concatenated" + " string";';
			const buf = Buffer.from(code);
			p.parse(buf, 'example.js');
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should not extract concatenated strings mixed with a variable', () => {
			const catalog = new Catalog({ noHeader: true, extractAll: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner);
			const code = '"concatenated" + sep + "string";';
			const buf = Buffer.from(code);
			p.parse(buf, 'example.js');
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should not extract concatenated strings with a trailing variable', () => {
			const catalog = new Catalog({ noHeader: true, extractAll: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner);
			const code = '"concatenated" + " string" + suffix;';
			const buf = Buffer.from(code);
			p.parse(buf, 'example.js');
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});
	});

	describe('comments', () => {
		it('should extract all kinds of comments', () => {
			const catalog = new Catalog({
				noHeader: true,
				addAllComments: true,
				extractAll: true,
			});
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner);
			const code = `
// Single-line comment.
_('single line');

/* Block comment. */
_('block');

// Single-line
/* and block combined. */
_('single + block');

/* Block */
// and single-line combined.
_('block + single');

// Skip this.

// But catch this.
_('only immediately preceding');

// Only for one string.
_('catcher'); _('loser');
`;
			p.parse(Buffer.from(code), 'example.js');
			expect(catalog.toString()).toMatchSnapshot();
			expect(warner).not.toHaveBeenCalled();
		});
	});

	describe('messages', () => {
		it('should extract a single argument', () => {
			const catalog = new Catalog({
				noHeader: true,
				keywords: [new Keyword('_')],
			});
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner);
			const code = '_("Hello, world!")';
			p.parse(Buffer.from(code), 'example.js');
			const expected = `#: example.js:1
msgid "Hello, world!"
msgstr ""
`;
			expect(catalog.toString()).toEqual(expected);
			expect(warner).not.toHaveBeenCalled();
		});
	});
});
