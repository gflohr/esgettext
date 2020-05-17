import { Catalog } from '../pot/catalog';
import { JavaScriptParser } from './javascript';

const date = '2020-04-23 08:50+0300';

describe('JavaScript parser', () => {
	describe('extract all strings', () => {
		it('should extract all kinds of strings', () => {
			const catalog = new Catalog({ date });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner);
			const code = `
// Directive.
"double-quoted string";

// Function call.
_('single-quoted string');

// perl-brace-format.
_x('Hello, {name}!');
`;
			p.parse(Buffer.from(code), 'example.ts');
			expect(catalog.toString()).toMatchSnapshot();
		});

		it('should extract all kinds of comments', () => {
			const catalog = new Catalog({ date });
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
