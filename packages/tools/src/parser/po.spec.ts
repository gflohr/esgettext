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

#, perl-brace-format, no-perl-format
msgid "Hello, {name}!"
msgstr ""

#: src/example.ts:2304 src/other.ts:1303
msgid "strawberry"
msgstr ""

msgid "One universe"
msgid_plural "Parallel universes"
msgstr[0] ""
msgstr[1] ""

msgid "escapes"
msgstr "\\\\\\a\\b\\t\\n\\v\\f\\r\\""

msgid ""
"Multi-line msgid"
msgstr ""

msgctxt ""
"multi-line"
msgid "Hello, world!\\n"
msgstr ""

msgid "One world"
msgid_plural ""
"Many worlds"
msgstr[0] ""
msgstr[1] ""

#~ msgid "obsolete entry"
#~ msgstr ""
`;
			const parser = new PoParser(warner);
			const result = parser.parse(input, 'example.js');

			expect(result.toString()).toMatchSnapshot();
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

		it('should bail out on duplicate msgctxt sections', () => {
			const parser = new PoParser(warner);
			const input = `msgid "okay"
msgstr ""

msgctxt "Menu"
msgctxt "File"
msgid "Hello, world!"
msgstr ""
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:5:1: duplicate "msgctxt" section'),
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

		it('should bail out on non-strings for msgids', () => {
			const parser = new PoParser(warner);
			const input = `msgid "okay"
msgstr ""

msgid        not
msgstr "okay"
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:14: syntax error'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on unterminated strings', () => {
			const parser = new PoParser(warner);
			const input = `msgid "okay"
msgstr ""

msgid "not
msgstr "okay"
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:7: end-of-line within string'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on trailing backslashes', () => {
			const parser = new PoParser(warner);
			const input = `msgid "okay"
msgstr ""

msgid "not\\"
msgstr "okay"
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:7: end-of-line within string'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on invalid control sequences', () => {
			const parser = new PoParser(warner);
			const input = `msgid "okay"
msgstr ""

msgid "beware of \\x-rays"
msgstr ""
`;
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:18: invalid control sequence'),
			);
			expect(warner).not.toHaveBeenCalled();
		});
	});

	describe('warnings', () => {
		const warner = jest.fn();

		beforeEach(() => {
			warner.mockReset();
		});

		it('should warn about empty flags', () => {
			const parser = new PoParser(warner);
			const input = `#, fuzzy   ,, perl-brace-format
msgid "Hello, {name}!"
msgstr ""
`;
			const result = parser.parse(input, 'example.js');
			expect(result.toString()).toMatchSnapshot();
			expect(warner).toHaveBeenCalledTimes(1);
			expect(warner).toHaveBeenNthCalledWith(
				1,
				'example.js:1:11: ignoring empty flag',
			);
		});

		it('should warn about invalid references', () => {
			const parser = new PoParser(warner);
			const input = `#:   src/here.js:2304     somewhere
msgid "Hello, {name}!"
msgstr ""
`;

			const result = parser.parse(input, 'example.js');
			expect(result.toString()).toMatchSnapshot();
			expect(warner).toHaveBeenCalledTimes(1);
			expect(warner).toHaveBeenNthCalledWith(
				1,
				'example.js:1:27: ignoring mal-formed reference "somewhere"',
			);
		});
	});
});
