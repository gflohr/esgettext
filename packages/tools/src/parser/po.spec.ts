import { PoParser } from './po';

describe('parse po files', () => {
	describe('simple file', () => {
		it('should parse', () => {
			const input = `# Translations for smell-o-vision.
# Copyright (C) 2020 SmellOVision Inc.
# This file is distributed under the same license as the smell-o-vision package.
# John Doe <john.doe@example.com>, 2020.
#
msgid ""
msgstr ""
"Project-Id-Version: smell-o-vision 0.1.1\\n"
"Report-Msgid-Bugs-To: jane.appleseed@example.com\\n"
"POT-Creation-Date: 2020-04-23 08:50+0300\\n"
"PO-Revision-Date: 2020-04-25 23:04+0300\\n"
"Last-Translator: John Doe <John.Doe@example.com>\\n"
"Language-Team: Finnish <fi@li.org>\\n"
"Language: Finnish\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=utf-8\\n"
"Content-Transfer-Encoding: 8bit\\n"

msgid "no comment"
msgstr ""

#, perl-brace-format
msgid "Hello, {name}!"
msgstr ""

#: src/example.ts:2304
msgid "strawberry"
msgstr ""

#~ msgid "obsolete entry"
#~ msgstr ""
`;
			// eslint-disable-next-line no-console
			const parser = new PoParser(console.warn);
			const result = parser.parse(input, 'example.js');

			expect(result).toBeDefined();
		});
	});

	describe('errors', () => {
		it('should discard lone strings', () => {
			// eslint-disable-next-line no-console
			const parser = new PoParser(console.warn);
			const input = `msgid "okay"
msgstr ""

"does not belong here"
`;

			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:1: syntax error'),
			);
		});

		it('should bail out on unexpected input', () => {
			// eslint-disable-next-line no-console
			const parser = new PoParser(console.warn);
			let input = `msgid "okay"
msgstr ""

MSGID "uppercase not allowed"
msgstr ""
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:1: keyword "MSGID" unknown'),
			);

			input = `msgid "okay"
msgstr ""

nsgid "no, no, no"
msgstr ""
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:1: keyword "nsgid" unknown'),
			);
		});

		it('should bail out on garbage', () => {
			// eslint-disable-next-line no-console
			const parser = new PoParser(console.warn);
			const input = `msgid "okay"
msgstr ""

'garbage'
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:1: syntax error'),
			);
		});

		it('should bail out on entries w/o msgid', () => {
			// eslint-disable-next-line no-console
			const parser = new PoParser(console.warn);
			const input = `msgid "okay"
msgstr ""

# Missing msgid.
msgstr ""
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:6:1: missing "msgid" section'),
			);
		});

		it('should bail out on duplicate entries', () => {
			const warner = jest.fn();
			const parser = new PoParser(warner);
			const input = `msgid "okay"
msgstr ""

msgid "okay"
msgstr ""
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:6:1: cannot proceed after fatal error'),
			);
			expect(warner).toHaveBeenCalledTimes(2);
			expect(warner).toHaveBeenNthCalledWith(
				1,
				'example.ts:4: duplicate message definition...',
			);
			expect(warner).toHaveBeenNthCalledWith(
				2,
				'example.ts:1: ...this is the location of the first definition',
			);
		});
	});
});
