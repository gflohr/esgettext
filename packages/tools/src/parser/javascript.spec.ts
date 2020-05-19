import { Catalog } from '../pot/catalog';
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
			p.parse(Buffer.from(code), 'example.ts');
			expect(catalog.toString()).toMatchSnapshot();
		});

		it('should extract concatenated strings', () => {
			const catalog = new Catalog({ noHeader: true, extractAll: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner);
			const code = '"concatenated" + " str" + "i" + "n" + "g";';
			const buf = Buffer.from(code);
			p.parse(buf, 'example.ts');
			const expected = `#: example.ts:1
msgid "concatenated string"
msgstr ""
`;
			expect(catalog.toString()).toEqual(expected);
		});

		it('should not extract concatenated strings with a leading variable', () => {
			const catalog = new Catalog({ noHeader: true, extractAll: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner);
			const code = 'prefix + "concatenated" + " string";';
			const buf = Buffer.from(code);
			p.parse(buf, 'example.ts');
			expect(catalog.toString()).toEqual('');
		});

		it('should not extract concatenated strings mixed with a variable', () => {
			const catalog = new Catalog({ noHeader: true, extractAll: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner);
			const code = '"concatenated" + sep + "string";';
			const buf = Buffer.from(code);
			p.parse(buf, 'example.ts');
			expect(catalog.toString()).toEqual('');
		});

		it('should not extract concatenated strings with a trailing variable', () => {
			const catalog = new Catalog({ noHeader: true, extractAll: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner);
			const code = '"concatenated" + " string" + suffix;';
			const buf = Buffer.from(code);
			p.parse(buf, 'example.ts');
			expect(catalog.toString()).toEqual('');
		});
	});

	describe('comments', () => {
		it('should extract all kinds of comments', () => {
			const catalog = new Catalog({ noHeader: true, addAllComments: true });
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
			p.parse(Buffer.from(code), 'example.ts');
			expect(catalog.toString()).toMatchSnapshot();
		});
	});
});
