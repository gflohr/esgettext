import { POTEntry } from './entry';

describe('POT entries', () => {
	describe('simple cases', () => {
		it('should output singular entries', () => {
			const entry = new POTEntry({ msgid: 'foobar' });
			const expected = `msgid "foobar"
msgstr ""
`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should output plural entries', () => {
			const entry = new POTEntry({ msgid: 'foobar', msgidPlural: 'foobars' });
			const expected = `msgid "foobar"
msgid_plural "foobars"
msgstr[0] ""
msgstr[1] ""
`;
			expect(entry.toString()).toEqual(expected);
		});
	});

	describe('escaping', () => {
		it('should escape a bell character', () => {
			const entry = new POTEntry({ msgid: '\u0007' });
			const expected = `msgid "\\a"\nmsgstr ""\n`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should escape a backspace character', () => {
			const entry = new POTEntry({ msgid: '\b' });
			const expected = `msgid "\\b"\nmsgstr ""\n`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should escape a horizontal tab', () => {
			const entry = new POTEntry({ msgid: '\t' });
			const expected = `msgid "\\t"\nmsgstr ""\n`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should escape newlines', () => {
			const entry = new POTEntry({ msgid: '\n\n' });
			const expected = `msgid ""
"\\n"
"\\n"
msgstr ""
`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should escape a vertical tab', () => {
			const entry = new POTEntry({ msgid: '\v' });
			const expected = `msgid "\\v"\nmsgstr ""\n`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should escape a form feed', () => {
			const entry = new POTEntry({ msgid: '\f' });
			const expected = `msgid "\\f"\nmsgstr ""\n`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should escape a carriage return', () => {
			const entry = new POTEntry({ msgid: '\r' });
			const expected = `msgid "\\r"\nmsgstr ""\n`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should throw an exception for all other controls', () => {
			for (let i = 0; i < 0x7; ++i) {
				expect(() => new POTEntry({ msgid: String.fromCharCode(i) })).toThrow();
				expect(
					() =>
						new POTEntry({ msgid: 'x', msgidPlural: String.fromCharCode(i) }),
				).toThrow();
			}
			for (let i = 0xe; i < 0x20; ++i) {
				expect(() => new POTEntry({ msgid: String.fromCharCode(i) })).toThrow();
				expect(
					() =>
						new POTEntry({ msgid: 'x', msgidPlural: String.fromCharCode(i) }),
				).toThrow();
			}
		});
	});

	describe('line wrapping', () => {
		it('should wrap long lines by default', () => {
			const entry = new POTEntry(
				{ msgid: 'For a very long time.' },
				{ width: 20 },
			);
			const expected = `msgid ""
"For a very long "
"time."
msgstr ""
`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should not wrap long lines, when requested', () => {
			const entry = new POTEntry(
				{ msgid: 'For a very long time.' },
				{ width: 20, noWrap: true },
			);
			const expected = `msgid "For a very long time."
msgstr ""
`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should always wrap at newline characters', () => {
			const entry = new POTEntry({ msgid: 'line 1\nline 2\nline 3\n' });
			const expected = `msgid ""
"line 1\\n"
"line 2\\n"
"line 3\\n"
msgstr ""
`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should never wrap inside words', () => {
			const entry = new POTEntry({ msgid: 'ForAVeryLongTime' }, { width: 10 });
			const expected = `msgid ""
"ForAVeryLongTime"
msgstr ""
`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should never wrap inside words with prefix and postfix', () => {
			const entry = new POTEntry(
				{ msgid: 'before ForAVeryLongTime after' },
				{ width: 10 },
			);
			const expected = `msgid ""
"before "
"ForAVeryLongTime "
"after"
msgstr ""
`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should not exceed the requested width', () => {
			const entry = new POTEntry(
				{ msgid: 'At the Height of the Fighting' },
				{ width: 16 },
			);
			const expected = `msgid ""
"At the Height "
"of the "
"Fighting"
msgstr ""
`;
			expect(entry.toString()).toEqual(expected);
		});
	});

	describe('meta information', () => {
		it('should output automatic comments', () => {
			const entry = new POTEntry(
				{
					msgid: 'Sun',
					automatic: ['TRANSLATORS: The weekday, not our star!'],
				},
				{
					// Should be ignored for comments!
					width: 20,
				},
			);
			const expected = `#. TRANSLATORS: The weekday, not our star!
msgid "Sun"
msgstr ""
`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should handle newlines inside automatic comments', () => {
			const entry = new POTEntry(
				{
					msgid: 'Sun',
					automatic: ['TRANSLATORS:\nThe weekday,\nnot our star!'],
				},
				{
					// Should be ignored for comments!
					width: 20,
				},
			);
			const expected = `#. TRANSLATORS:
#. The weekday,
#. not our star!
msgid "Sun"
msgstr ""
`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should output flags', () => {
			const entry = new POTEntry(
				{
					msgid: 'hello',
					flags: ['no-perl-format', 'no-perl-brace-format'],
				},
				{
					// Should be ignored for flags!
					width: 20,
				},
			);
			const expected = `#, no-perl-format, no-perl-brace-format
msgid "hello"
msgstr ""
`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should make flags unique', () => {
			const entry = new POTEntry(
				{
					msgid: 'hello',
					flags: ['no-perl-format', 'no-perl-format'],
				},
				{
					// Should be ignored for flags!
					width: 20,
				},
			);
			const expected = `#, no-perl-format
msgid "hello"
msgstr ""
`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should output references', () => {
			const entry = new POTEntry({
				msgid: 'hello',
				references: ['src/hello.ts:2304', 'src/goodbye.ts:2304'],
			});
			const expected = `#: src/hello.ts:2304, src/goodbye.ts:2304
msgid "hello"
msgstr ""
`;
			expect(entry.toString()).toEqual(expected);
		});
		it('should wrap references', () => {
			const entry = new POTEntry(
				{
					msgid: 'hello',
					references: ['src/hello.ts:2304', 'src/goodbye.ts:2304'],
				},
				{
					width: 25,
				},
			);
			const expected = `#: src/hello.ts:2304
#: src/goodbye.ts:2304
msgid "hello"
msgstr ""
`;
			expect(entry.toString()).toEqual(expected);
		});
	});
});
