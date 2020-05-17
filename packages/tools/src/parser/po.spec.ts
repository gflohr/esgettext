import { Catalog } from '../pot/catalog';
import { PoParser } from './po';

const date = '2020-04-23 08:50+0300';

describe('parse po files', () => {
	describe('simple file', () => {
		const warner = jest.fn();

		beforeEach(() => {
			warner.mockReset();
		});

		it('should parse', () => {
			const pot = `# Translations for smell-o-vision.
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

msgctxt "escapes"
msgid "\\\\\\a\\b\\t\\n\\v\\f\\r\\""
msgstr ""

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

msgid "The translation has to be discarded."
msgstr "Die Übersetzung muss verworfen werden."

msgid "And this one, too."
msgid_plural "And these ones, too."
msgstr[0] "For a very long time ..."
msgstr[1] "For a very long time ..."
msgstr[2] "For a very long time ..."
msgstr[3] "For a very long time ..."
msgstr[4] "For a very long time ..."
msgstr[5] "For a very long time ..."
msgstr[6] "For a very long time ..."
msgstr[7] "For a very long time ..."

#. TRANSLATORS: This is the day of the week, not our star.
#. It is the abbreviation for Sunday.
msgid "Sun"
msgstr ""

#~ msgid "obsolete entry"
#~ msgstr ""
`;
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const input = Buffer.from(pot);
			parser.parse(input, 'example.js');

			expect(catalog.toString()).toMatchSnapshot();
			expect(warner).not.toHaveBeenCalled();
		});
	});

	describe('errors', () => {
		const warner = jest.fn();

		beforeEach(() => {
			warner.mockReset();
		});

		it('should discard lone strings', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid "okay"
msgstr ""

"does not belong here"
`;
			const input = Buffer.from(pot);
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:1: syntax error'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on unexpected input', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			let pot = `msgid "okay"
msgstr ""

MSGID "uppercase not allowed"
msgstr ""
`;
			let input = Buffer.from(pot);
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:1: keyword "MSGID" unknown'),
			);
			expect(warner).not.toHaveBeenCalled();

			pot = `msgid "okay"
msgstr ""

nsgid "no, no, no"
msgstr ""
`;
			input = Buffer.from(pot);
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:1: keyword "nsgid" unknown'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on garbage', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid "okay"
msgstr ""

'garbage'
`;
			const input = Buffer.from(pot);
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:1: syntax error'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on entries w/o msgid', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid "okay"
msgstr ""

# Missing msgid.
msgstr ""
`;
			const input = Buffer.from(pot);
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:6:1: missing "msgid" section'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on duplicate entries', () => {
			const localWarner = jest.fn();
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, localWarner);
			const pot = `msgid "okay"
msgstr ""

msgid "okay"
msgstr ""
`;
			const input = Buffer.from(pot);
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
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid "okay"
msgstr ""

msgid "not"
msgstr ""
msgid "okay"
`;
			const input = Buffer.from(pot);
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:6:1: duplicate "msgid" section'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on duplicate msgstr sections', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid "okay"
msgstr ""

msgid "not"
msgstr ""
msgstr "okay"
`;
			const input = Buffer.from(pot);
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:6:1: duplicate "msgstr" section'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on duplicate msgid_plural sections', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid "okay"
msgstr ""

msgid "not"
msgid_plural "really"
msgid_plural "really"
msgstr[0] ""
msgstr[1] ""
`;
			const input = Buffer.from(pot);
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:6:1: duplicate "msgid_plural" section'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on duplicate msgctxt sections', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid "okay"
msgstr ""

msgctxt "Menu"
msgctxt "File"
msgid "Hello, world!"
msgstr ""
`;
			const input = Buffer.from(pot);
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:5:1: duplicate "msgctxt" section'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should enforce consistent use of #~', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid "okay"
msgstr ""

msgid "not"
#~ msgstr "okay"
msgstr "okay"
`;
			const input = Buffer.from(pot);
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:5:1: inconsistent use of #~'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on non-strings for msgids', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid "okay"
msgstr ""

msgid        not
msgstr "okay"
`;
			const input = Buffer.from(pot);
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:14: syntax error'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on unterminated strings', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid "okay"
msgstr ""

msgid "not
msgstr "okay"
`;
			const input = Buffer.from(pot);
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:7: end-of-line within string'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on trailing backslashes', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid "okay"
msgstr ""

msgid "not\\"
msgstr "okay"
`;
			const input = Buffer.from(pot);
			expect(() => parser.parse(input, 'example.ts')).toThrow(
				new Error('example.ts:4:7: end-of-line within string'),
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should bail out on invalid control sequences', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid "okay"
msgstr ""

msgid "beware of \\x-rays"
msgstr ""
`;
			const input = Buffer.from(pot);
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
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `#, fuzzy   ,, perl-brace-format
msgid "Hello, {name}!"
msgstr ""
`;
			const input = Buffer.from(pot);
			parser.parse(input, 'example.js');
			expect(catalog.toString()).toMatchSnapshot();
			expect(warner).toHaveBeenCalledTimes(1);
			expect(warner).toHaveBeenNthCalledWith(
				1,
				'example.js:1:11: ignoring empty flag',
			);
		});

		it('should warn about invalid references', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `#:   src/here.js:2304     somewhere
msgid "Hello, {name}!"
msgstr ""
`;
			const input = Buffer.from(pot);
			parser.parse(input, 'example.js');
			expect(catalog.toString()).toMatchSnapshot();
			expect(warner).toHaveBeenCalledTimes(1);
			expect(warner).toHaveBeenNthCalledWith(
				1,
				'example.js:1:27: ignoring mal-formed reference "somewhere"',
			);
		});
	});

	// FIXME! These tests have to be re-written because all input has to be
	// decoded to utf-8.
	describe('encoding', () => {
		const warner = jest.fn();

		beforeEach(() => {
			warner.mockReset();
		});

		it('should accept cp1252', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\\n"
"Content-Type: text/plain; charset=CP1252\\n"
`;
			const input = Buffer.from(pot);
			parser.parse(input, 'example.ts');
			expect(catalog.toString()).toMatchSnapshot();
			expect(warner).not.toHaveBeenCalled();
		});

		it('should throw on unsupported encodings', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\\n"
"Content-Type: text/plain; charset=CP1252\\n"
`;
			const input = Buffer.from(pot);
			expect(() => parser.parse(input, 'example.ts', 'invalid')).toThrow(
				'unsupported encoding "invalid"',
			);
			expect(warner).not.toHaveBeenCalled();
		});

		it('should re-parse a lone header', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\\n"
"Content-Type: text/plain; charset=iso-8859-1\\n"`;

			const input = Buffer.from(pot);
			parser.parse(input, 'example.ts');
			expect(catalog.encoding()).toEqual('CHARSET');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should not reparse w/o content-type header', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\\n"
"Content-Transfer-Encoding: 8bit\\n"`;
			const input = Buffer.from(pot);
			parser.parse(input, 'example.ts');
			expect(catalog.encoding()).toEqual('CHARSET');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should not reparse w/o charset', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\\n"
"Content-Type: text/plain\\n"
"Content-Transfer-Encoding: 8bit\\n"`;
			const input = Buffer.from(pot);
			parser.parse(input, 'example.ts');
			expect(catalog.encoding()).toEqual('CHARSET');
			expect(warner).not.toHaveBeenCalled();
		});

		it('should not reparse for unknown encoding', () => {
			const catalog = new Catalog({ date });
			const parser = new PoParser(catalog, warner);
			const pot = `msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\\n"
"Content-Type: text/plain; charset=invalid\\n"
"Content-Transfer-Encoding: 8bit\\n"`;
			const input = Buffer.from(pot);
			parser.parse(input, 'example.ts');
			expect(catalog.encoding()).toEqual('CHARSET');
			expect(warner).toHaveBeenCalledTimes(2);
			expect(warner).toHaveBeenNthCalledWith(
				1,
				'example.ts:5:1: The charset "invalid" is not a portable encoding name.',
			);
			expect(warner).toHaveBeenNthCalledWith(
				2,
				'example.ts:5:1: Message conversion to the users charset might not work.',
			);
		});
	});
});
