import { Catalog } from '../pot/catalog';
import { Keyword } from '../pot/keyword';
import { JavaScriptParser } from './javascript';

describe('JavaScript parser', () => {
	describe('strings', () => {
		it('should extract all kinds of strings', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, { extractAll: true });
			const code = `
// Directive.
_("double-quoted string");

// Function call.
_('single-quoted string');

// perl-brace-format.
_x('Hello, {name}!');
`;
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			expect(catalog.toString()).toMatchSnapshot();
			expect(warner).not.toHaveBeenCalled();
		});

		it('should extract concatenated strings', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, { extractAll: true });
			const code = '"concatenated" + " str" + "i" + "n" + "g";';
			const buf = Buffer.from(code);
			expect(p.parse(buf, 'example.js')).toBeTruthy();
			const expected = `#: example.js:1
msgid "concatenated string"
msgstr ""
`;
			expect(catalog.toString()).toEqual(expected);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should not extract concatenated strings with a leading variable', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, { extractAll: true });
			const code = 'prefix + "concatenated" + " string";';
			const buf = Buffer.from(code);
			expect(p.parse(buf, 'example.js')).toBeTruthy();
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should not extract concatenated strings mixed with a variable', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, { extractAll: true });
			const code = '"concatenated" + sep + "string";';
			const buf = Buffer.from(code);
			expect(p.parse(buf, 'example.js')).toBeTruthy();
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should not extract concatenated strings with a trailing variable', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, { extractAll: true });
			const code = '"concatenated" + " string" + suffix;';
			const buf = Buffer.from(code);
			expect(p.parse(buf, 'example.js')).toBeTruthy();
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});
	});

	describe('comments', () => {
		it('should extract all kinds of comments', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				extractAll: true,
				addAllComments: true,
			});
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
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			expect(catalog.toString()).toMatchSnapshot();
			expect(warner).not.toHaveBeenCalled();
		});
	});

	describe('messages', () => {
		it('should extract a single argument', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_')],
			});
			const code = '_("Hello, world!")';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			const expected = `#: example.js:1
msgid "Hello, world!"
msgstr ""
`;
			expect(catalog.toString()).toEqual(expected);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should extract singular and plural form', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_n', ['1', '2'])],
			});
			const code = '_n("There was an error!", "There were errors!", n)';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			const expected = `#: example.js:1
msgid "There was an error!"
msgid_plural "There were errors!"
msgstr[0] ""
msgstr[1] ""
`;
			expect(catalog.toString()).toEqual(expected);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should extract context, singular and plural form', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_np', ['1c', '2', '3'])],
			});
			const code =
				'_np("context", "There was an error!", "There were errors!", n)';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			const expected = `#: example.js:1
msgctxt "context"
msgid "There was an error!"
msgid_plural "There were errors!"
msgstr[0] ""
msgstr[1] ""
`;
			expect(catalog.toString()).toEqual(expected);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should handle other callees', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_')],
			});
			const code = '"string".trim()';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should not extract from unknown methods', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_')],
			});
			const code = 'gettext("string")';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should honor the total arguments spec', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_', ['1t'])],
			});
			const code = '_("Hello", "world")';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should not extract non existing singular arguments', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_')],
			});
			const code = '_()';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should not extract non existing plural arguments', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_n', ['1', '2'])],
			});
			const code = '_n("One universe")';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should not extract non existing context arguments', () => {
			const catalog = new Catalog({
				noHeader: true,
			});
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_pn', ['1', '2', '3c'])],
			});
			const code = '_pn("one world", "many worlds")';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should reject variables as singular arguments', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_np', ['1c', '2', '3'])],
			});
			const code = '_np("world", earth, "many earths")';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should allow simple template literals as singular arguments', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_np', ['1c', '2', '3'])],
			});
			const code = '_np("world", `one earth`, "many earths")';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			const expected = `#: example.js:1
msgctxt "world"
msgid "one earth"
msgid_plural "many earths"
msgstr[0] ""
msgstr[1] ""
`;
			expect(catalog.toString()).toEqual(expected);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should reject template literals with embedded expressions as singular arguments', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_np', ['1c', '2', '3'])],
			});
			const code = '_np("world", `one ${planet}`, "many earths")';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeFalsy();
			expect(catalog.toString()).toEqual('');
			expect(warner).toHaveBeenCalledTimes(1);
			expect(warner).toHaveBeenNthCalledWith(
				1,
				'example.js:1:13-1:28: error: template literals with embedded' +
					' expressions are not allowed as arguments to gettext' +
					' functions because they are not constant',
			);
		});

		it('should reject variables as plural arguments', () => {
			const catalog = new Catalog({
				noHeader: true,
			});
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_np', ['1c', '2', '3'])],
			});
			const code = '_np("world", "earth", earths)';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should allow simple template literals as plural arguments', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_np', ['1c', '2', '3'])],
			});
			const code = '_np("world", "one earth", `many earths`)';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			const expected = `#: example.js:1
msgctxt "world"
msgid "one earth"
msgid_plural "many earths"
msgstr[0] ""
msgstr[1] ""
`;
			expect(catalog.toString()).toEqual(expected);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should reject template literals with embedded expressions as plural arguments', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_np', ['1c', '2', '3'])],
			});
			const code = '_np("world", "one earth", `many ${planets}`)';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeFalsy();
			expect(catalog.toString()).toEqual('');
			expect(warner).toHaveBeenCalledTimes(1);
			expect(warner).toHaveBeenNthCalledWith(
				1,
				'example.js:1:26-1:43: error: template literals with embedded' +
					' expressions are not allowed as arguments to gettext' +
					' functions because they are not constant',
			);
		});

		it('should reject variables as msgctxt arguments', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_np', ['1c', '2', '3'])],
			});
			const code = '_np(world, "earth", "many earths")';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should allow simple template literals as msgctxt arguments', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_np', ['1c', '2', '3'])],
			});
			const code = '_np(`world`, "one earth", "many earths")';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			const expected = `#: example.js:1
msgctxt "world"
msgid "one earth"
msgid_plural "many earths"
msgstr[0] ""
msgstr[1] ""
`;
			expect(catalog.toString()).toEqual(expected);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should reject template literals with embedded expressions as msgctxt arguments', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_np', ['1c', '2', '3'])],
			});
			const code = '_np("world", "one earth", `many ${planets}`)';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeFalsy();
			expect(catalog.toString()).toEqual('');
			expect(warner).toHaveBeenCalledTimes(1);
			expect(warner).toHaveBeenNthCalledWith(
				1,
				'example.js:1:26-1:43: error: template literals with embedded' +
					' expressions are not allowed as arguments to gettext' +
					' functions because they are not constant',
			);
		});
	});

	describe('encoding', () => {
		it('should decode to JavaScript strings', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_')],
			});
			const code = '_("Hello, world!")';
			expect(
				p.parse(Buffer.from(code), 'example.js', 'iso-8859-1'),
			).toBeTruthy();
			const expected = `#: example.js:1
msgid "Hello, world!"
msgstr ""
`;
			expect(catalog.toString()).toEqual(expected);
			expect(warner).not.toHaveBeenCalled();
		});
	});

	describe('binary expressions', () => {
		it('should extract concatenated strings', () => {
			const catalog = new Catalog({
				noHeader: true,
			});
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_')],
			});
			const code = '_("It\'s a " + "sad" + " and beautiful world!")';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			const expected = `#: example.js:1
msgid "It's a sad and beautiful world!"
msgstr ""
`;
			expect(catalog.toString()).toEqual(expected);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should extract concatenated strings with simple template literals', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_')],
			});
			const code = '_("It\'s a " + `sad` + " and beautiful world!")';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			const expected = `#: example.js:1
msgid "It's a sad and beautiful world!"
msgstr ""
`;
			expect(catalog.toString()).toEqual(expected);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should ignore concatenated strings with variables', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_')],
			});
			const code = '_("It\'s a " + what + " and beautiful world!")';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			expect(catalog.toString()).toEqual('');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should report concatenated strings with interpolations', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_')],
			});
			const code = '_("It\'s " + `a ${what}` + " and beautiful world!")';
			expect(p.parse(Buffer.from(code), 'example.js')).toBeFalsy();
			expect(warner).toHaveBeenCalledTimes(1);
			expect(warner).toHaveBeenCalledWith(
				'example.js:1:12-1:23: error:' +
					' template literals with embedded expressions are not' +
					' allowed as arguments to gettext functions because' +
					' they are not constant',
			);
		});
	});

	describe('comments above calls', () => {
		it('should extract xgettext: comments', () => {
			const catalog = new Catalog({ noHeader: true });
			const warner = jest.fn();
			const p = new JavaScriptParser(catalog, warner, {
				keywords: [new Keyword('_')],
			});
			const code = `// xgettext: no-perl-brace-format
_("It's a {sad} and beautiful world!")
`;
			expect(p.parse(Buffer.from(code), 'example.js')).toBeTruthy();
			const expected = `#: example.js:2
#, no-perl-brace-format
msgid "It's a {sad} and beautiful world!"
msgstr ""
`;
			expect(catalog.toString()).toEqual(expected);
			expect(warner).not.toHaveBeenCalled();
		});
	});
});
