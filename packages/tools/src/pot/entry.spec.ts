import { POTEntry } from './entry';

describe('POT entries', () => {
	describe('simple cases', () => {
		it('should output singular entries', () => {
			const entry = new POTEntry({ msgid: 'foobar' });
			const expected = `msgid "foobar"
msgstr ""
`;
			expect(entry.serialize()).toEqual(expected);
		});
		it('should output plural entries', () => {
			const entry = new POTEntry({ msgid: 'foobar', msgidPlural: 'foobars' });
			const expected = `msgid "foobar"
msgid_plural "foobars"
msgstr[0] ""
msgstr[1] ""
`;
			expect(entry.serialize()).toEqual(expected);
		});
	});

	describe('escaping', () => {
		it('should escape newlines', () => {
			const entry = new POTEntry({ msgid: '\n\n' });
			const expected = `msgid ""
"\\n"
"\\n"
msgstr ""
`;
			expect(entry.serialize()).toEqual(expected);
		});
	});
});
