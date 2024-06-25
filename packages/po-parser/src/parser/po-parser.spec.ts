import { PoParser } from './po-parser';

const warnSpy = jest.spyOn(global.console, 'warn').mockImplementation(() => {
	/* ignore */
});
const errorSpy = jest.spyOn(global.console, 'error').mockImplementation(() => {
	/* ignore */
});

describe('parse po files', () => {
	describe('simple file', () => {
		afterEach(() => {
			warnSpy.mockClear();
			errorSpy.mockClear();
		});

		it('should parse', () => {
			const po = `# Translations for smell-o-vision.
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
			const parser = new PoParser();
			const input = Buffer.from(po);
			const catalogue = parser.parse(input, 'example.js');

			expect(catalogue).not.toBeNull();
			expect(catalogue?.renderPo()).toMatchSnapshot();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});
	});

	describe('errors', () => {
		afterEach(() => {
			warnSpy.mockClear();
			errorSpy.mockClear();
		});

		it('should discard lone strings', () => {
			const parser = new PoParser();
			const pot = `msgid "okay"
msgstr ""

"does not belong here"
`;
			const input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenCalledWith(
				'example.ts:4:1: Error: syntax error',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should discard lone strings reading from standard input', () => {
			const parser = new PoParser();
			const pot = `msgid "okay"
msgstr ""

"does not belong here"
`;
			const input = Buffer.from(pot);
			expect(parser.parse(input, '-')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenCalledWith(
				'[standard input]:4:1: Error: syntax error',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should bail out on unexpected input', () => {
			const parser = new PoParser();
			let pot = `msgid "okay"
msgstr ""

MSGID "uppercase not allowed"
msgstr ""
`;
			let input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(2);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'example.ts:4:1: Error: keyword "MSGID" unknown',
			);
			expect(errorSpy).toHaveBeenNthCalledWith(
				2,
				'example.ts:4:6: Error: syntax error',
			);
			expect(warnSpy).not.toHaveBeenCalled();

			pot = `msgid "okay"
msgstr ""

nsgid "no, no, no"
msgstr ""
`;
			input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(4);
			expect(errorSpy).toHaveBeenNthCalledWith(
				3,
				'example.ts:4:1: Error: keyword "nsgid" unknown',
			);
			expect(errorSpy).toHaveBeenNthCalledWith(
				4,
				'example.ts:4:6: Error: syntax error',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should bail out on garbage', () => {
			const parser = new PoParser();
			const pot = `msgid "okay"
msgstr ""

'garbage'
`;
			const input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'example.ts:4:1: Error: syntax error',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should bail out on entries w/o msgid', () => {
			const parser = new PoParser();
			const pot = `msgid "okay"
msgstr ""

# Missing msgid.
msgstr ""
`;
			const input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'example.ts:6:1: Error: missing "msgid" section',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should bail out on duplicate entries', () => {
			const parser = new PoParser();
			const pot = `msgid "okay"
msgstr ""

msgid "okay"
msgstr ""
`;
			const input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(2);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'example.ts:4:1: Error: duplicate message definition...',
			);
			expect(errorSpy).toHaveBeenNthCalledWith(
				2,
				'example.ts:1:1: Error: ...this is the location of the first definition',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should bail out on duplicate msgid sections', () => {
			const parser = new PoParser();
			const pot = `msgid "okay"
msgstr ""

msgid "not"
msgstr ""
msgid "okay"
`;
			const input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'example.ts:6:1: Error: duplicate "msgid" section',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should bail out on duplicate msgstr sections', () => {
			const parser = new PoParser();
			const pot = `msgid "okay"
msgstr ""

msgid "not"
msgstr ""
msgstr "okay"
`;
			const input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'example.ts:6:1: Error: duplicate "msgstr" section',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should bail out on duplicate msgid_plural sections', () => {
			const parser = new PoParser();
			const pot = `msgid "okay"
msgstr ""

msgid "not"
msgid_plural "really"
msgid_plural "really"
msgstr[0] ""
msgstr[1] ""
`;
			const input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'example.ts:6:1: Error: duplicate "msgid_plural" section',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should bail out on duplicate msgctxt sections', () => {
			const parser = new PoParser();
			const pot = `msgid "okay"
msgstr ""

msgctxt "Menu"
msgctxt "File"
msgid "Hello, world!"
msgstr ""
`;
			const input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'example.ts:5:1: Error: duplicate "msgctxt" section',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should enforce consistent use of #~', () => {
			const parser = new PoParser();
			const pot = `msgid "okay"
msgstr ""

msgid "not"
#~ msgstr "okay"
msgstr "okay"
`;
			const input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'example.ts:5:1: Error: inconsistent use of #~',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should bail out on non-strings for msgids', () => {
			const parser = new PoParser();
			const pot = `msgid "okay"
msgstr ""

msgid        not
msgstr "okay"
`;
			const input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'example.ts:4:14: Error: syntax error',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should bail out on unterminated strings', () => {
			const parser = new PoParser();
			const pot = `msgid "okay"
msgstr ""

msgid "not
msgstr "okay"
`;
			const input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'example.ts:4:11: Error: end-of-line within string',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should bail out on trailing backslashes', () => {
			const parser = new PoParser();
			const pot = `msgid "okay"
msgstr ""

msgid "not\\"
msgstr "okay"
`;
			const input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'example.ts:4:7: Error: end-of-line within string',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should bail out on invalid control sequences', () => {
			const parser = new PoParser();
			const pot = `msgid "okay"
msgstr ""

msgid "beware of \\x-rays"
msgstr ""
`;
			const input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'example.ts:4:18: Error: invalid control sequence',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});
	});

	describe('warnings', () => {
		afterEach(() => {
			warnSpy.mockClear();
			errorSpy.mockClear();
		});

		it('should warn about empty flags', () => {
			const parser = new PoParser();
			const pot = `#, fuzzy   ,, perl-brace-format
msgid "Hello, {name}!"
msgstr ""
`;
			const input = Buffer.from(pot);
			const catalogue = parser.parse(input, 'example.js');
			expect(catalogue?.renderPo()).toMatchSnapshot();
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy).toHaveBeenNthCalledWith(
				1,
				'example.js:1:11: warning: ignoring empty flag',
			);
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('should warn about empty flags reading from standard input', () => {
			const parser = new PoParser();
			const pot = `#, fuzzy   ,, perl-brace-format
msgid "Hello, {name}!"
msgstr ""
`;
			const input = Buffer.from(pot);
			const catalogue = parser.parse(input, '-');
			expect(catalogue?.renderPo()).toMatchSnapshot();
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy).toHaveBeenNthCalledWith(
				1,
				'[standard input]:1:11: warning: ignoring empty flag',
			);
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('should warn about invalid references', () => {
			const parser = new PoParser();
			const pot = `#:   src/here.js:2304     somewhere
msgid "Hello, {name}!"
msgstr ""
`;
			const input = Buffer.from(pot);
			const catalogue = parser.parse(input, 'example.js');
			expect(catalogue?.renderPo()).toMatchSnapshot();
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy).toHaveBeenNthCalledWith(
				1,
				'example.js:1:27: warning: ignoring mal-formed reference "somewhere"',
			);
			expect(errorSpy).not.toHaveBeenCalled();
		});
	});

	// FIXME! These tests have to be re-written because all input has to be
	// decoded to utf-8.
	describe('encoding', () => {
		afterEach(() => {
			warnSpy.mockClear();
			errorSpy.mockClear();
		});

		it('should accept cp1252', () => {
			const parser = new PoParser();
			const pot = `msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\\n"
"Content-Type: text/plain; charset=CP1252\\n"
`;
			const input = Buffer.from(pot);
			const catalogue = parser.parse(input, 'example.ts');
			expect(catalogue?.renderPo()).toMatchSnapshot();
			expect(errorSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should throw on unsupported encodings', () => {
			const parser = new PoParser();
			const pot = `msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\\n"
"Content-Type: text/plain; charset=CP1252\\n"
`;
			const input = Buffer.from(pot);
			expect(parser.parse(input, 'example.ts', 'invalid')).toBeNull();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'unsupported encoding "invalid"',
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should re-parse a lone header', () => {
			const parser = new PoParser();
			const pot = `msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\\n"
"Content-Type: text/plain; charset=iso-8859-1\\n"`;

			const input = Buffer.from(pot);
			parser.parse(input, 'example.ts');
			// FIXME! How can we test that the catalog gets re-parsed?
			//expect(catalog.encoding()).toEqual('CHARSET');
			expect(errorSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should not reparse w/o content-type header', () => {
			const parser = new PoParser();
			const pot = `msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\\n"
"Content-Transfer-Encoding: 8bit\\n"`;
			const input = Buffer.from(pot);
			parser.parse(input, 'example.ts');
			// FIXME! How can that be tested?
			//expect(catalog.encoding()).toEqual('CHARSET');
			expect(errorSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should not reparse w/o charset', () => {
			const parser = new PoParser();
			const pot = `msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\\n"
"Content-Type: text/plain\\n"
"Content-Transfer-Encoding: 8bit\\n"`;
			const input = Buffer.from(pot);
			parser.parse(input, 'example.ts');
			// FIXME! How can that be tested?
			//expect(catalog.encoding()).toEqual('CHARSET');
			expect(errorSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should not reparse for unknown encoding', () => {
			const parser = new PoParser();
			const pot = `msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\\n"
"Content-Type: text/plain; charset=invalid\\n"
"Content-Transfer-Encoding: 8bit\\n"`;
			const input = Buffer.from(pot);
			parser.parse(input, 'example.ts');
			// FIXME! How can that be tested?
			//expect(catalog.encoding()).toEqual('CHARSET');
			expect(warnSpy).toHaveBeenCalledTimes(2);
			expect(warnSpy).toHaveBeenNthCalledWith(
				1,
				'example.ts:5:1: warning: the charset "invalid" is not a portable encoding name.',
			);
			expect(warnSpy).toHaveBeenNthCalledWith(
				2,
				'example.ts:5:1: warning: message conversion to the users charset might not work.',
			);
			expect(errorSpy).not.toHaveBeenCalled();

			console.error('TODO #0: Find shorter names!');
			console.error('TODO #1: Do not discard translations!');
			console.error('TODO #2: Preserve obsolete entries!');
			console.error(
				'TODO #3: Preserve the new diffs with the previous version!',
			);
		});
	});
});
