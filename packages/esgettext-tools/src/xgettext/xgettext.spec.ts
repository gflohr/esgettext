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

function resetMocks(): void {
	readFileSync.mockReset();
	writeFileSync.mockReset();
	warnSpy.mockReset();
	errorSpy.mockReset();
}

describe('xgettext', () => {
	describe('defaults', () => {
		beforeEach(() => {
			resetMocks();
		});

		it('should extract strings from javascript files', () => {
			const hello = `
console.log(gtx._('Hello, world!'));
`;
			const goodbye = `
console.log(gtx._('Goodbye, world!'));
`;

			readFileSync
				.mockReturnValueOnce(Buffer.from(hello))
				.mockReturnValueOnce(Buffer.from(goodbye));

			const argv = { ...baseArgv, _: ['hello1.js', 'goodbye.js'] };
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

			const argv = { ...baseArgv, _: ['hello2.ts', 'goodbye.ts'] };
			const xgettext = new XGettext(argv, date);
			expect(xgettext.run()).toEqual(0);
			expect(writeFileSync).toHaveBeenCalledTimes(1);

			const call = writeFileSync.mock.calls[0];
			expect(call[0]).toEqual('messages.po');
			expect(call[1]).toMatchSnapshot();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('should parse po files', () => {
			const po = `# SOME DESCRIPTIVE TITLE
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
"Language-Team: German <de@li.org>\\n"
"Language: \\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=utf-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"Plural-Forms: Plural-Forms: nplurals=2; plural=(n != 1);\\n"

#: src/cli/getopt.ts:122
#, perl-brace-format
msgid "'{programName}': unrecognized option '--{option}'"
msgstr ""
`;

			readFileSync.mockReturnValueOnce(Buffer.from(po));

			const argv = { ...baseArgv, _: ['de.po'] };
			const xgettext = new XGettext(argv, date);
			expect(xgettext.run()).toEqual(0);
			expect(writeFileSync).toHaveBeenCalledTimes(1);

			const call = writeFileSync.mock.calls[0];
			expect(call[0]).toEqual('messages.po');
			expect(call[1]).toMatchSnapshot();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('should parse pot files', () => {
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
			expect(xgettext.run()).toEqual(1);
			expect(writeFileSync).toHaveBeenCalledTimes(0);
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenCalled();
		});

		it('should fail on errors', () => {
			// Template literal is not constant.
			const hello = 'console.log(gtx._(`Hello, ${name}!`));';

			readFileSync.mockReturnValueOnce(Buffer.from(hello));

			const argv = { ...baseArgv, _: ['hello3.js'] };
			const xgettext = new XGettext(argv, date);
			expect(xgettext.run()).toEqual(1);
			expect(writeFileSync).not.toHaveBeenCalled();

			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'hello3.js:1:18-1:35: error: template literals with embedded expressions are not allowed as arguments to gettext functions because they are not constant',
			);
		});

		it('should fail on exceptions', () => {
			readFileSync.mockImplementationOnce(() => {
				throw new Error('no such file or directory');
			});

			const argv = { ...baseArgv, _: ['hello4.js'] };
			const xgettext = new XGettext(argv, date);
			expect(xgettext.run()).toEqual(1);
			expect(writeFileSync).not.toHaveBeenCalled();

			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'hello4.js: Error: no such file or directory',
			);
		});

		it('should fail on output exceptions', () => {
			const code = 'gtx._("Hello, world!");';

			readFileSync.mockReturnValueOnce(Buffer.from(code));
			writeFileSync.mockImplementationOnce(() => {
				throw new Error('no such file or directory');
			});

			const argv = { ...baseArgv, _: ['hello5.js'] };
			const xgettext = new XGettext(argv, date);
			expect(xgettext.run()).toEqual(1);
			expect(writeFileSync).toHaveBeenCalledTimes(1);

			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'esgettext-xgettext: Error: no such file or directory',
			);
		});
	});
});

describe('xgettext command-line options and arguments', () => {
	describe('input file location', () => {
		describe('input file arguments', () => {
			beforeEach(() => {
				resetMocks();
			});

			it('should treat non-options as input file names', () => {
				const argv = {
					...baseArgv,
					output: 'option-output.pot',
					_: ['here/option-output.js', 'there/option-output.js'],
				};
				const xgettext = new XGettext(argv, date);
				expect(xgettext.run()).toEqual(1);
				expect(writeFileSync).not.toHaveBeenCalled();
				expect(readFileSync).toHaveBeenCalledTimes(2);
				expect(readFileSync.mock.calls[0][0]).toEqual('here/option-output.js');
				expect(readFileSync.mock.calls[1][0]).toEqual('there/option-output.js');
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalledTimes(2);
			});

			it('should interpret "-" as stdin', () => {
				const code = 'gtx._("Hello, world!")';

				const argv = {
					...baseArgv,
					output: 'option-output.pot',
					_: ['-'],
				};
				const stdinSpy = jest
					.spyOn(global.process.stdin, 'read')
					.mockReturnValueOnce(Buffer.from(code));

				const xgettext = new XGettext(argv, date);
				expect(xgettext.run()).toEqual(0);
				expect(stdinSpy).toHaveBeenCalledTimes(1);
				stdinSpy.mockReset();
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect(writeFileSync.mock.calls[0][0]).toMatchSnapshot();
				expect(readFileSync).not.toHaveBeenCalled();
				expect(warnSpy).toHaveBeenCalledTimes(1);
				expect(warnSpy).toHaveBeenNthCalledWith(
					1,
					'esgettext-xgettext: warning: language for standard' +
						' input is unknown without option "--language";' +
						' will try JavaScript',
				);
				expect(errorSpy).toHaveBeenCalledTimes(0);
			});

			it('should catch errors on stdin', () => {
				const argv = {
					...baseArgv,
					language: 'JavaScript',
					_: ['-'],
				};
				const stdinSpy = jest
					.spyOn(global.process.stdin, 'read')
					.mockImplementation(() => {
						throw new Error('I/O error');
					});

				const xgettext = new XGettext(argv, date);
				expect(xgettext.run()).toEqual(1);
				expect(stdinSpy).toHaveBeenCalledTimes(1);
				stdinSpy.mockReset();
				expect(writeFileSync).not.toHaveBeenCalled();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalledTimes(1);
				expect(errorSpy).toHaveBeenCalledWith(
					'[standard input]: Error: I/O error',
				);
			});
		});

		describe('option --files-from', () => {
			beforeEach(() => resetMocks());

			it('should accept multiple --files-from options', () => {
				const potfiles1 = 'files-from1.js';
				const filesFrom1 = 'gtx._("Hello, world!")';
				const potfiles2 = 'files-from2.js';
				const filesFrom2 = 'gtx._("Hello, world!")';
				readFileSync
					.mockReturnValueOnce(Buffer.from(potfiles1))
					.mockReturnValueOnce(Buffer.from(potfiles2))
					.mockReturnValueOnce(Buffer.from(filesFrom1))
					.mockReturnValueOnce(Buffer.from(filesFrom2));
				const argv = {
					...baseArgv,
					filesFrom: ['POTFILES-1', 'POTFILES-2'],
					_: [] as Array<string>,
				};
				const xgettext = new XGettext(argv, date);
				expect(xgettext.run()).toEqual(0);
				expect(readFileSync).toHaveBeenCalledTimes(4);
				expect(readFileSync.mock.calls[0][0]).toEqual('POTFILES-1');
				expect(readFileSync.mock.calls[1][0]).toEqual('POTFILES-2');
				expect(readFileSync.mock.calls[2][0]).toEqual('files-from1.js');
				expect(readFileSync.mock.calls[3][0]).toEqual('files-from2.js');
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});

			it('should report errors for missing --files-from files', () => {
				readFileSync.mockImplementation(filename => {
					throw new Error(
						`ENOENT: no such file or directory, open '${filename}'`,
					);
				});
				const argv = {
					...baseArgv,
					filesFrom: ['POTFILES'],
					_: [] as Array<string>,
				};
				const xgettext = new XGettext(argv, date);
				expect(xgettext.run()).toEqual(1);
				expect(readFileSync).toHaveBeenCalledTimes(1);
				expect(readFileSync).toHaveBeenCalledWith('POTFILES');
				expect(writeFileSync).not.toHaveBeenCalled();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalledWith(
					"esgettext-xgettext: Error: ENOENT: no such file or directory, open 'POTFILES'",
				);
			});

			it('should treat "-" as standard input', () => {
				const filesFrom1 = 'gtx._("Hello, world!")';
				const filesFrom2 = 'gtx._("Hello, world!")';
				readFileSync
					.mockReturnValueOnce(Buffer.from(filesFrom1))
					.mockReturnValueOnce(Buffer.from(filesFrom2));
				const argv = {
					...baseArgv,
					filesFrom: ['-'],
					_: [] as Array<string>,
				};
				const stdinSpy = jest
					.spyOn(global.process.stdin, 'read')
					.mockReturnValueOnce(
						Buffer.from(`
files-from-1.js
files-from-2.js
`),
					);

				const xgettext = new XGettext(argv, date);
				expect(xgettext.run()).toEqual(0);
				expect(stdinSpy).toHaveBeenCalledTimes(1);
				stdinSpy.mockReset();
				expect(readFileSync).toHaveBeenCalledTimes(2);
				expect(readFileSync.mock.calls[0][0]).toEqual('files-from-1.js');
				expect(readFileSync.mock.calls[1][0]).toEqual('files-from-2.js');
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});
		});

		describe('option --directory', () => {
			beforeEach(resetMocks);

			it('should search for files in other directories', () => {
				const argv = {
					...baseArgv,
					directory: ['foo', 'bar', 'baz'],
					_: ['directory.js'] as Array<string>,
				};
				readFileSync.mockImplementation(filename => {
					throw new Error(
						`ENOENT: no such file or directory, open '${filename}'`,
					);
				});
				const xgettext = new XGettext(argv, date);
				expect(xgettext.run()).toEqual(1);
				expect(readFileSync).toHaveBeenCalledTimes(3);
				expect(readFileSync).toHaveBeenNthCalledWith(1, 'foo/directory.js');
				expect(readFileSync).toHaveBeenNthCalledWith(2, 'bar/directory.js');
				expect(readFileSync).toHaveBeenNthCalledWith(3, 'baz/directory.js');
				expect(writeFileSync).not.toHaveBeenCalled();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalledTimes(1);
				expect(errorSpy).toHaveBeenNthCalledWith(
					1,
					"directory.js: Error: ENOENT: no such file or directory, open 'baz/directory.js'",
				);
			});
		});
	});

	describe('output file location', () => {
		describe('option --output', () => {
			beforeEach(() => {
				resetMocks();
			});

			it('should honor the option --output', () => {
				const code = 'console.log(gtx._("Hello, world!"))';
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					output: 'option-output.pot',
					_: ['option-output.js'],
				};
				const xgettext = new XGettext(argv, date);
				expect(xgettext.run()).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect(writeFileSync.mock.calls[0][0]).toEqual('option-output.pot');
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});

			it('should write to stdout', () => {
				const code = 'console.log(gtx._("Hello, world!"))';
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					output: '-',
					_: ['option-output.js'],
				};
				const xgettext = new XGettext(argv, date);

				const stdoutSpy = jest
					.spyOn(global.process.stdout, 'write')
					.mockImplementation(() => {
						return true;
					});
				expect(xgettext.run()).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(0);
				expect(stdoutSpy.mock.calls).toMatchSnapshot();
				stdoutSpy.mockRestore();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});
		});

		describe('option --default-domain', () => {
			beforeEach(() => {
				resetMocks();
			});

			it('should default to "messages"', () => {
				const code = 'gtx._("Hello, world")';
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					_: ['option-output.js'],
				};
				const xgettext = new XGettext(argv, date);

				expect(xgettext.run()).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect(writeFileSync.mock.calls[0][0]).toEqual('messages.po');
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});

			it('should be changed to "strings"', () => {
				const code = 'gtx._("Hello, world")';
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					defaultDomain: 'strings',
					_: ['option-output.js'],
				};
				const xgettext = new XGettext(argv, date);

				expect(xgettext.run()).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect(writeFileSync.mock.calls[0][0]).toEqual('strings.po');
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});
		});
		describe('option --output-dir', () => {
			beforeEach(() => {
				resetMocks();
			});

			it('should be changed to "po"', () => {
				const code = 'gtx._("Hello, world")';
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					outputDir: 'po',
					_: ['option-output.js'],
				};
				const xgettext = new XGettext(argv, date);

				expect(xgettext.run()).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect(writeFileSync.mock.calls[0][0]).toEqual('po/messages.po');
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});
		});
	});

	describe('choice of input language', () => {
		describe('option --language', () => {
			afterEach(() => {
				resetMocks();
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
					_: ['hello6.pot'],
				};
				const xgettext = new XGettext(argv, date);
				expect(xgettext.run()).toEqual(1);
				//expect(writeFileSync).toHaveBeenCalledTimes(0);
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalled();
			});

			it('should bail out on unknown languages', () => {
				const code = `gtx._('Hello, world!)`;

				readFileSync.mockReturnValueOnce(Buffer.from(code));

				const argv = {
					...baseArgv,
					language: 'VBScript',
					_: ['hello7.js'],
				};
				expect(() => new XGettext(argv, date)).toThrow(
					'language "VBScript" unknown',
				);
			});

			it('should accept the language typescript', () => {
				const code = 'gtx._("Hello, world!");';

				readFileSync.mockReturnValueOnce(Buffer.from(code));

				const argv = {
					...baseArgv,
					language: 'TypeScript',
					_: ['hello-language-typescript.ts'],
				};
				const xgettext = new XGettext(argv, date);
				expect(xgettext.run()).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect(writeFileSync.mock.calls[0][1]).toMatchSnapshot();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});
		});
	});

	describe('output details', () => {
		describe('option --force-po', () => {
			beforeEach(() => {
				resetMocks();
			});

			it('should not write empty catalogs', () => {
				const code = 'console.log("Hello, world!")';
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					_: ['force-po1.js'],
				};
				const xgettext = new XGettext(argv, date);
				expect(xgettext.run()).toEqual(0);
				expect(writeFileSync).not.toHaveBeenCalled();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});

			it('should write empty catalogs with option --force-po', () => {
				const code = 'console.log("Hello, world!")';
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					forcePo: true,
					_: ['force-po1.js'],
				};
				const xgettext = new XGettext(argv, date);
				expect(xgettext.run()).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect(writeFileSync.mock.calls[0][1]).toMatchSnapshot();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});
		});
	});
});
