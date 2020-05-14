import { PoParser } from './po';

describe('parse po files', () => {
	describe('simple file', () => {
		const warner = jest.fn();

		beforeEach(() => {
			warner.mockReset();
		});

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
			const parser = new PoParser(warner);
			const result = parser.parse(input, 'example.js');

			expect(result).toBeDefined();
			expect(warner).not.toHaveBeenCalled();
		});
	});

	describe('errors', () => {
		const warner = jest.fn();

		beforeEach(() => {
			warner.mockReset();
		});

		it('should discard lone strings', () => {
			const parser = new PoParser(warner);
			const input = `msgid "okay"
msgstr ""

"does not belong here"
`;

			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:1: syntax error'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on unexpected input', () => {
			const parser = new PoParser(warner);
			let input = `msgid "okay"
msgstr ""

MSGID "uppercase not allowed"
msgstr ""
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:1: keyword "MSGID" unknown'),
			);
			expect(warner).not.toHaveBeenCalled();

			input = `msgid "okay"
msgstr ""

nsgid "no, no, no"
msgstr ""
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:1: keyword "nsgid" unknown'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on garbage', () => {
			const parser = new PoParser(warner);
			const input = `msgid "okay"
msgstr ""

'garbage'
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:1: syntax error'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on entries w/o msgid', () => {
			const parser = new PoParser(warner);
			const input = `msgid "okay"
msgstr ""

# Missing msgid.
msgstr ""
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:6:1: missing "msgid" section'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on duplicate entries', () => {
			const localWarner = jest.fn();
			const parser = new PoParser(localWarner);
			const input = `msgid "okay"
msgstr ""

msgid "okay"
msgstr ""
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:6:1: cannot proceed after fatal error'),
			);
			expect(localWarner).toHaveBeenCalledTimes(2);
			expect(localWarner).toHaveBeenNthCalledWith(
				1,
				'example.ts:4: duplicate message definition...',
			);
			expect(localWarner).toHaveBeenNthCalledWith(
				2,
				'example.ts:1: ...this is the location of the first definition',
			);
		});

		it('should bail out on duplicate msgid sections', () => {
			const parser = new PoParser(warner);
			const input = `msgid "okay"
msgstr ""

msgid "not"
msgstr ""
msgid "okay"
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:6:1: duplicate "msgid" section'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on duplicate msgstr sections', () => {
			const parser = new PoParser(warner);
			const input = `msgid "okay"
msgstr ""

msgid "not"
msgstr ""
msgstr "okay"
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:6:1: duplicate "msgstr" section'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on duplicate msgid_plural sections', () => {
			const parser = new PoParser(warner);
			const input = `msgid "okay"
msgstr ""

msgid "not"
msgid_plural "really"
msgid_plural "really"
msgstr[0] ""
msgstr[1] ""
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:6:1: duplicate "msgid_plural" section'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should enforce consistent use of #~', () => {
			const parser = new PoParser(warner);
			const input = `msgid "okay"
msgstr ""

msgid "not"
#~ msgstr "okay"
msgstr "okay"
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:5:1: inconsistent use of #~'),
			);
			expect(warner).not.toHaveBeenCalled();
		});
	});
});
