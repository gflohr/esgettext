import * as fs from 'fs';
import { XGettext } from './xgettext';

jest.mock('fs');

const date = '2020-04-23 08:50+0300';
const readFileSync = fs.readFileSync as jest.Mock;
const writeFileSync = fs.writeFileSync as jest.Mock;
const warnSpy = jest.spyOn(global.console, 'warn').mockImplementation(() => {
	/* Do nothing. */
});
const errorSpy = jest.spyOn(global.console, 'error').mockImplementation(() => {
	/* Do nothing. */
});

const baseArgv = {
	$0: 'esgettext-xgettext',
};

function clearMocks(): void {
	readFileSync.mockClear();
	writeFileSync.mockClear();
	warnSpy.mockClear();
	errorSpy.mockClear();
}

describe('xgettext', () => {
	describe('defaults', () => {
		afterEach(() => {
			clearMocks();
		});

		it('should extract strings from javascript files', () => {
			const hello = `
console.log(gtx._('Hello, world!'));
`;
			const goodbye = `
console.log(gtx._('Goodbye, world!'));
`;

			readFileSync.mockReturnValueOnce(hello).mockReturnValueOnce(goodbye);

			const argv = { ...baseArgv, _: ['hello.js', 'goodbye.js'] };
			const xgettext = new XGettext(argv, date);
			expect(xgettext.run()).toEqual(0);
			expect(writeFileSync).toHaveBeenCalledTimes(1);

			const call = writeFileSync.mock.calls[0];
			expect(call[0]).toEqual('messages.po');
			expect(call[1]).toMatchSnapshot();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('should extract strings from typescript files', () => {
			const hello = `
const hello: string = gtx._('Hello, world!');
`;
			const goodbye = `
const goodbye: string = gtx._('Goodbye, world!');
`;

			readFileSync.mockReturnValueOnce(hello).mockReturnValueOnce(goodbye);

			const argv = { ...baseArgv, _: ['hello.ts', 'goodbye.ts'] };
			const xgettext = new XGettext(argv, date);
			expect(xgettext.run()).toEqual(0);
			expect(writeFileSync).toHaveBeenCalledTimes(1);

			const call = writeFileSync.mock.calls[0];
			expect(call[0]).toEqual('messages.po');
			expect(call[1]).toMatchSnapshot();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('should parse po/pot files', () => {
			const pot = `# SOME DESCRIPTIVE TITLE
# Copyright (C) YEAR THE PACKAGE'S COPYRIGHT HOLDER
# This file is distributed under the same license as the PACKAGE package.
# FIRST AUTHOR <EMAIL@ADDRESS>, YEAR.
#
#, fuzzy
msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\\n"
"Report-Msgid-Bugs-To: MSGID_BUGS_ADDRESS\\n"
"POT-Creation-Date: 2020-05-25 11:50+0300\\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"
"Language-Team: LANGUAGE <LL@li.org>\\n"
"Language: \\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=utf-8\\n"
"Content-Transfer-Encoding: 8bit\\n"

#: src/cli/getopt.ts:122
#, perl-brace-format
msgid "'{programName}': unrecognized option '--{option}'"
msgstr ""
`;

			readFileSync.mockReturnValueOnce(Buffer.from(pot));

			const argv = { ...baseArgv, _: ['package.pot'] };
			const xgettext = new XGettext(argv, date);
			expect(xgettext.run()).toEqual(0);
			expect(writeFileSync).toHaveBeenCalledTimes(1);

			const call = writeFileSync.mock.calls[0];
			expect(call[0]).toEqual('messages.po');
			expect(call[1]).toMatchSnapshot();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('should fall back to the JavaScript parser', () => {
			const pot = `# SOME DESCRIPTIVE TITLE
# Copyright (C) YEAR THE PACKAGE'S COPYRIGHT HOLDER
# This file is distributed under the same license as the PACKAGE package.
# FIRST AUTHOR <EMAIL@ADDRESS>, YEAR.
#
#, fuzzy
msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\\n"
"Report-Msgid-Bugs-To: MSGID_BUGS_ADDRESS\\n"
"POT-Creation-Date: 2020-05-25 11:50+0300\\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"
"Language-Team: LANGUAGE <LL@li.org>\\n"
"Language: \\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=utf-8\\n"
"Content-Transfer-Encoding: 8bit\\n"

#: src/cli/getopt.ts:122
#, perl-brace-format
msgid "'{programName}': unrecognized option '--{option}'"
msgstr ""
`;

			readFileSync.mockReturnValueOnce(Buffer.from(pot));

			const argv = { ...baseArgv, _: ['package.xyz'] };
			const xgettext = new XGettext(argv, date);
			expect(xgettext.run()).toEqual(0);
			expect(writeFileSync).toHaveBeenCalledTimes(0);
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenCalled();
		});
	});

	describe('option --language', () => {
		afterEach(() => {
			clearMocks();
		});

		it('should honor the --language option', () => {
			const code = `# SOME DESCRIPTIVE TITLE
# Copyright (C) YEAR THE PACKAGE'S COPYRIGHT HOLDER
# This file is distributed under the same license as the PACKAGE package.
# FIRST AUTHOR <EMAIL@ADDRESS>, YEAR.
#
#, fuzzy
msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\\n"
"Report-Msgid-Bugs-To: MSGID_BUGS_ADDRESS\\n"
"POT-Creation-Date: 2020-05-25 11:50+0300\\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"
"Language-Team: LANGUAGE <LL@li.org>\\n"
"Language: \\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=utf-8\\n"
"Content-Transfer-Encoding: 8bit\\n"

#: src/cli/getopt.ts:122
#, perl-brace-format
msgid "'{programName}': unrecognized option '--{option}'"
msgstr ""
`;

			readFileSync.mockReturnValueOnce(Buffer.from(code));

			const argv = {
				...baseArgv,
				// This is on purpose the wrong language.
				language: 'javascript',
				_: ['hello.pot'],
			};
			const xgettext = new XGettext(argv, date);
			expect(xgettext.run()).toEqual(0);
			expect(writeFileSync).toHaveBeenCalledTimes(0);
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalled();
		});

		/*
		it('should bail out on unknown languages', () => {
			const code = `gtx._('Hello, world!)`;

			readFileSync.mockReturnValueOnce(Buffer.from(code));

			const argv = {
				...baseArgv,
				language: 'VBScript',
				_: ['hello.js'],
			};
			expect(() => new XGettext(argv, date)).toThrow('language "VBScript" unknown');
		});
		*/
	});
});
