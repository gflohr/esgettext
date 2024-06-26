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
	_: [],
	$0: 'esgettext',
};

const baseConfig = {
	files: [],
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

		it('should extract strings from javascript files', async () => {
			const hello = `
console.log(gtx._('Hello, world!'));
`;
			const goodbye = `
console.log(gtx._('Goodbye, world!'));
`;

			readFileSync
				.mockReturnValueOnce(Buffer.from(hello))
				.mockReturnValueOnce(Buffer.from(goodbye));

			const argv = { ...baseArgv, INPUTFILE: ['hello1.js', 'goodbye.js'] };
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(0);
			expect(writeFileSync).toHaveBeenCalledTimes(1);

			const call = writeFileSync.mock.calls[0] as string[];
			expect(call[0]).toEqual('messages.po');
			expect(call[1]).toMatchSnapshot();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('should extract strings from typescript files', async () => {
			const hello = `
const hello: string = gtx._('Hello, world!');
`;
			const goodbye = `
const goodbye: string = gtx._('Goodbye, world!');
`;

			readFileSync
				.mockReturnValueOnce(Buffer.from(hello))
				.mockReturnValueOnce(Buffer.from(goodbye));

			const argv = { ...baseArgv, INPUTFILE: ['hello2.ts', 'goodbye.ts'] };
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(0);
			expect(writeFileSync).toHaveBeenCalledTimes(1);

			const call = writeFileSync.mock.calls[0] as string[];
			expect(call[0]).toEqual('messages.po');
			expect(call[1]).toMatchSnapshot();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('should parse po files', async () => {
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

			const argv = { ...baseArgv, INPUTFILE: ['de.po'] };
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(0);
			expect(writeFileSync).toHaveBeenCalledTimes(1);

			const call = writeFileSync.mock.calls[0] as string[];
			expect(call[0]).toEqual('messages.po');
			expect(call[1]).toMatchSnapshot();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('should parse pot files', async () => {
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

			const argv = { ...baseArgv, INPUTFILE: ['package.pot'] };
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(0);
			expect(writeFileSync).toHaveBeenCalledTimes(1);

			const call = writeFileSync.mock.calls[0] as string[];
			expect(call[0]).toEqual('messages.po');
			expect(call[1]).toMatchSnapshot();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('should fall back to the JavaScript parser', async () => {
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

			const argv = { ...baseArgv, INPUTFILE: ['package.xyz'] };
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(1);
			expect(writeFileSync).toHaveBeenCalledTimes(0);
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenCalled();
		});

		it('should fail on errors', async () => {
			// Template literal is not constant.
			const hello = 'console.log(gtx._(`Hello, ${name}!`));';

			readFileSync.mockReturnValueOnce(Buffer.from(hello));

			const argv = { ...baseArgv, INPUTFILE: ['hello3.js'] };
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(1);
			expect(writeFileSync).not.toHaveBeenCalled();

			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'hello3.js:1:18-1:35: Error: template literals with embedded expressions are not allowed as arguments to gettext functions because they are not constant',
			);
		});

		it('should fail on exceptions', async () => {
			readFileSync.mockImplementationOnce(() => {
				throw new Error('no such file or directory');
			});

			const argv = { ...baseArgv, INPUTFILE: ['hello4.js'] };
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(1);
			expect(writeFileSync).not.toHaveBeenCalled();

			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'hello4.js: Error: no such file or directory',
			);
		});

		it('should fail on output exceptions', async () => {
			const code = 'gtx._("Hello, world!");';

			readFileSync.mockReturnValueOnce(Buffer.from(code));
			writeFileSync.mockImplementationOnce(() => {
				throw new Error('no such file or directory');
			});

			const argv = { ...baseArgv, INPUTFILE: ['hello5.js'] };
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(1);
			expect(writeFileSync).toHaveBeenCalledTimes(1);

			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				'esgettext: Error: no such file or directory',
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

			it('should treat non-options as input file names', async () => {
				const argv = {
					...baseArgv,
					output: 'option-output.pot',
					INPUTFILE: ['here/option-output.js', 'there/option-output.js'],
				};
				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(1);
				expect(writeFileSync).not.toHaveBeenCalled();
				expect(readFileSync).toHaveBeenCalledTimes(2);
				expect((readFileSync.mock.calls[0] as string[])[0]).toEqual(
					'here/option-output.js',
				);
				expect((readFileSync.mock.calls[1] as string[])[0]).toEqual(
					'there/option-output.js',
				);
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalledTimes(2);
			});

			it('should interpret "-" as stdin', async () => {
				const code = 'gtx._("Hello, world!")';

				const argv = {
					...baseArgv,
					output: 'option-output.pot',
					INPUTFILE: ['-'],
				};
				const stdinSpy = jest
					.spyOn(global.process.stdin, 'read')
					.mockReturnValueOnce(Buffer.from(code));

				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(0);
				expect(stdinSpy).toHaveBeenCalledTimes(1);
				stdinSpy.mockReset();
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect((writeFileSync.mock.calls[0] as string[])[0]).toMatchSnapshot();
				expect(readFileSync).not.toHaveBeenCalled();
				expect(warnSpy).toHaveBeenCalledTimes(1);
				expect(warnSpy).toHaveBeenNthCalledWith(
					1,
					'esgettext: Warning: language for standard' +
						' input is unknown without option "--language";' +
						' will try TypeScript',
				);
				expect(errorSpy).toHaveBeenCalledTimes(0);
			});

			it('should catch errors on stdin', async () => {
				const argv = {
					...baseArgv,
					language: 'JavaScript',
					INPUTFILE: ['-'],
				};
				const stdinSpy = jest
					.spyOn(global.process.stdin, 'read')
					.mockImplementation(() => {
						throw new Error('I/O error');
					});

				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(1);
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

			it('should accept multiple --files-from options', async () => {
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
					INPUTFILE: [] as Array<string>,
				};
				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(0);
				expect(readFileSync).toHaveBeenCalledTimes(4);
				expect((readFileSync.mock.calls[0] as string[])[0]).toEqual(
					'POTFILES-1',
				);
				expect((readFileSync.mock.calls[1] as string[])[0]).toEqual(
					'POTFILES-2',
				);
				expect((readFileSync.mock.calls[2] as string[])[0]).toEqual(
					'files-from1.js',
				);
				expect((readFileSync.mock.calls[3] as string[])[0]).toEqual(
					'files-from2.js',
				);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});

			it('should report errors for missing --files-from files', async () => {
				readFileSync.mockImplementation(filename => {
					throw new Error(
						`ENOENT: no such file or directory, open '${filename}'`,
					);
				});
				const argv = {
					...baseArgv,
					filesFrom: ['POTFILES'],
					INPUTFILE: [] as Array<string>,
				};
				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(1);
				expect(readFileSync).toHaveBeenCalledTimes(1);
				expect(readFileSync).toHaveBeenCalledWith('POTFILES');
				expect(writeFileSync).not.toHaveBeenCalled();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalledWith(
					"esgettext: Error: ENOENT: no such file or directory, open 'POTFILES'",
				);
			});

			it('should treat "-" as standard input', async () => {
				const filesFrom1 = 'gtx._("Hello, world!")';
				const filesFrom2 = 'gtx._("Hello, world!")';
				readFileSync
					.mockReturnValueOnce(Buffer.from(filesFrom1))
					.mockReturnValueOnce(Buffer.from(filesFrom2));
				const argv = {
					...baseArgv,
					filesFrom: ['-'],
					INPUTFILE: [] as Array<string>,
				};
				const stdinSpy = jest
					.spyOn(global.process.stdin, 'read')
					.mockReturnValueOnce(
						Buffer.from(`
files-from-1.js
files-from-2.js
`),
					);

				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(0);
				expect(stdinSpy).toHaveBeenCalledTimes(1);
				stdinSpy.mockReset();
				expect(readFileSync).toHaveBeenCalledTimes(2);
				expect((readFileSync.mock.calls[0] as string[])[0]).toEqual(
					'files-from-1.js',
				);
				expect((readFileSync.mock.calls[1] as string[])[0]).toEqual(
					'files-from-2.js',
				);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});
		});

		describe('option --directory', () => {
			beforeEach(resetMocks);

			it('should search for files in other directories', async () => {
				const argv = {
					...baseArgv,
					directory: ['foo', 'bar', 'baz'],
					INPUTFILE: ['directory.js'] as Array<string>,
				};
				readFileSync.mockImplementation(filename => {
					throw new Error(
						`ENOENT: no such file or directory, open '${filename}'`,
					);
				});
				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(1);
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

			it('should honor the option --output', async () => {
				const code = 'console.log(gtx._("Hello, world!"))';
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					output: 'option-output.pot',
					INPUTFILE: ['option-output.js'],
				};
				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect((writeFileSync.mock.calls[0] as string[])[0]).toEqual(
					'option-output.pot',
				);
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});

			it('should write to stdout', async () => {
				const code = 'console.log(gtx._("Hello, world!"))';
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					output: '-',
					INPUTFILE: ['option-output.js'],
				};
				const xgettext = new XGettext(baseConfig, date);

				const stdoutSpy = jest
					.spyOn(global.process.stdout, 'write')
					.mockImplementation(() => {
						return true;
					});
				expect(await xgettext.run(argv)).toEqual(0);
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

			it('should default to "messages"', async () => {
				const code = 'gtx._("Hello, world")';
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					INPUTFILE: ['option-output.js'],
				};
				const xgettext = new XGettext(baseConfig, date);

				expect(await xgettext.run(argv)).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect((writeFileSync.mock.calls[0] as string[])[0]).toEqual(
					'messages.po',
				);
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});

			it('should be changed to "strings"', async () => {
				const code = 'gtx._("Hello, world")';
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					defaultDomain: 'strings',
					INPUTFILE: ['option-output.js'],
				};
				const xgettext = new XGettext(baseConfig, date);

				expect(await xgettext.run(argv)).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect((writeFileSync.mock.calls[0] as string[])[0]).toEqual(
					'strings.po',
				);
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});
		});

		describe('option --output-dir', () => {
			beforeEach(() => {
				resetMocks();
			});

			it('should be changed to "po"', async () => {
				const code = 'gtx._("Hello, world")';
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					outputDir: 'po',
					INPUTFILE: ['option-output.js'],
				};
				const xgettext = new XGettext(baseConfig, date);

				expect(await xgettext.run(argv)).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect((writeFileSync.mock.calls[0] as string[])[0]).toEqual(
					'po/messages.po',
				);
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

			it('should honor the --language option', async () => {
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
					INPUTFILE: ['hello6.pot'],
				};
				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(1);
				//expect(writeFileSync).toHaveBeenCalledTimes(0);
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalled();
			});

			it('should accept the language typescript', async () => {
				const code = 'gtx._("Hello, world!");';

				readFileSync.mockReturnValueOnce(Buffer.from(code));

				const argv = {
					...baseArgv,
					language: 'TypeScript',
					INPUTFILE: ['hello-language-typescript.ts'],
				};
				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect((writeFileSync.mock.calls[0] as string[])[1]).toMatchSnapshot();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});
		});
	});

	describe('operation mode', () => {
		describe('option --join-existing', () => {
			beforeEach(resetMocks);

			it('should merge into the output file regardless of language', async () => {
				const existing = `
msgid "existing"
msgstr ""
`;
				readFileSync.mockReturnValueOnce(Buffer.from(existing));

				const code = 'gtx._("new")';
				readFileSync.mockReturnValueOnce(Buffer.from(code));

				const argv = {
					...baseArgv,
					output: 'package.pot',
					language: 'javascript',
					joinExisting: true,
					INPUTFILE: ['join-existing1.js'],
				};

				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(0);
				expect(readFileSync).toHaveBeenCalledTimes(2);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect((writeFileSync.mock.calls[0] as string[])[0]).toEqual(
					'package.pot',
				);
				expect((writeFileSync.mock.calls[0] as string[])[1]).toMatchSnapshot();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});

			it('should bail out, when output is stdout', async () => {
				const argv = {
					...baseArgv,
					output: '-',
					language: 'javascript',
					joinExisting: true,
					INPUTFILE: ['join-existing2.js'],
				};

				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(1);
				expect(readFileSync).not.toHaveBeenCalled();
				expect(writeFileSync).not.toHaveBeenCalled();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalledTimes(1);
				expect(errorSpy).toHaveBeenCalledWith(
					"esgettext: Error: '--join-existing' cannot be used, when output is written to stdout",
				);
			});

			it('should report exceptions', async () => {
				const argv = {
					...baseArgv,
					output: 'package.pot',
					language: 'javascript',
					joinExisting: true,
					INPUTFILE: ['join-existing3.js'],
				};

				readFileSync.mockImplementationOnce(() => {
					throw new Error('no such file or directory');
				});
				readFileSync.mockReturnValueOnce(Buffer.from(''));

				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(1);
				expect(readFileSync).toHaveBeenCalledTimes(2);
				expect(readFileSync).toHaveBeenNthCalledWith(1, 'package.pot');
				expect(readFileSync).toHaveBeenNthCalledWith(2, 'join-existing3.js');
				expect(writeFileSync).not.toHaveBeenCalled();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalledTimes(1);
				expect(errorSpy).toHaveBeenCalledWith(
					'package.pot: Error: no such file or directory',
				);
			});

			it('should report parser errors', async () => {
				const existing = `
msgidError "existing"
msgstr ""
`;
				readFileSync.mockReturnValueOnce(Buffer.from(existing));

				const code = 'gtx._("new")';
				readFileSync.mockReturnValueOnce(Buffer.from(code));

				const argv = {
					...baseArgv,
					output: 'package.pot',
					language: 'javascript',
					joinExisting: true,
					INPUTFILE: ['join-existing1.js'],
				};

				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(1);
				expect(readFileSync).toHaveBeenCalledTimes(2);
				expect(writeFileSync).not.toHaveBeenCalled();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalledTimes(1);
				expect(errorSpy).toHaveBeenCalledWith(
					'package.pot:2:1: Error: keyword "msgidError" unknown',
				);
			});
		});

		describe('option --exclude-file', () => {
			beforeEach(resetMocks);

			it('should exclude entries from the reference pots', async () => {
				const exclude1 = `
msgid "exclude 1"
msgstr ""
`;
				const exclude2 = `
msgid "exclude 2"
msgstr ""
`;
				const code = `
gtx._("exclude 1");
gtx._("exclude 2");
gtx._("catch me!");
`;
				readFileSync.mockReturnValueOnce(Buffer.from(exclude1));
				readFileSync.mockReturnValueOnce(Buffer.from(exclude2));
				readFileSync.mockReturnValueOnce(Buffer.from(code));

				const argv = {
					...baseArgv,
					excludeFile: ['exclude1.pot', 'exclude2.pot'],
					INPUTFILE: ['exclude-file1.js'],
				};

				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(0);
				expect(readFileSync).toHaveBeenCalledTimes(3);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect((writeFileSync.mock.calls[0] as string[])[1]).toMatchSnapshot();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});

			it('should report i/o errors for the reference pots', async () => {
				readFileSync.mockImplementation(() => {
					throw new Error('ouch!');
				});

				const argv = {
					...baseArgv,
					excludeFile: ['exclude1.pot', 'exclude2.pot'],
					INPUTFILE: ['exclude-file1.js'],
				};

				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(1);
				expect(readFileSync).toHaveBeenCalledTimes(1);
				expect(writeFileSync).toHaveBeenCalledTimes(0);
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalledTimes(1);
				expect(errorSpy).toHaveBeenNthCalledWith(1, 'esgettext: Error: ouch!');
			});

			it('should report parsing errors for the reference pots', async () => {
				readFileSync.mockReturnValue(Buffer.from('invalid'));

				const argv = {
					...baseArgv,
					excludeFile: ['exclude1.pot', 'exclude2.pot'],
					INPUTFILE: ['exclude-file1.js'],
				};

				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(1);
				expect(readFileSync).toHaveBeenCalledTimes(2);
				expect(writeFileSync).toHaveBeenCalledTimes(0);
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalledTimes(4);
				expect(errorSpy).toHaveBeenNthCalledWith(
					1,
					'exclude1.pot:1:1: Error: keyword "invalid" unknown',
				);
				expect(errorSpy).toHaveBeenNthCalledWith(
					2,
					'exclude1.pot:1:8: Error: syntax error',
				);
				expect(errorSpy).toHaveBeenNthCalledWith(
					3,
					'exclude2.pot:1:1: Error: keyword "invalid" unknown',
				);
				expect(errorSpy).toHaveBeenNthCalledWith(
					4,
					'exclude2.pot:1:8: Error: syntax error',
				);
			});
		});

		describe('add-comments', () => {
			beforeEach(resetMocks);

			it('should add selected comments', async () => {
				const code = `
// TRANSLATORS: The abbreviated day of the week, not our star.
gtx._("Sun");

// TESTERS: This must be translated!
gtx._("Hello, world!");

// DEVELOPERS: Don't repeat yourself.
gtx._("Copy & Paste");
`;
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					addComments: ['TRANSLATORS:', 'TESTERS:'],
					INPUTFILE: ['add-comments.js'],
				};
				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect((writeFileSync.mock.calls[0] as string[])[1]).toMatchSnapshot();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});
		});

		describe('add-all-comments', () => {
			beforeEach(resetMocks);

			it('should add all comments', async () => {
				const code = `
// TRANSLATORS: The abbreviated day of the week, not our star.
gtx._("Sun");

// TESTERS: This must be translated!
gtx._("Hello, world!");

// DEVELOPERS: Don't repeat yourself.
gtx._("Copy & Paste");
`;
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					addAllComments: true,
					INPUTFILE: ['add-comments.js'],
				};
				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect((writeFileSync.mock.calls[0] as string[])[1]).toMatchSnapshot();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});
		});
	});

	describe('language specific options', () => {
		describe('--extract-all', () => {
			beforeEach(resetMocks);

			it('should extract all strings', async () => {
				const code = `
gtx._("gettext function");
console.log("non-gettext-function");
`;
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					extractAll: true,
					INPUTFILE: ['extract-all.js'],
				};
				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect((writeFileSync.mock.calls[0] as string[])[1]).toMatchSnapshot();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});
		});

		describe('--keyword', () => {
			beforeEach(resetMocks);

			it('should extract the selected keywords', async () => {
				const code = `
gtx._("ignore");
gettext("catch");
npgettext("context", "one file", "multiple files", 2304);
`;
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					keyword: ['', 'gettext', 'npgettext:1c,2,3'],
					INPUTFILE: ['keyword.js'],
				};
				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect((writeFileSync.mock.calls[0] as string[])[1]).toMatchSnapshot();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});
		});
	});

	describe('output details', () => {
		describe('option --force-po', () => {
			beforeEach(resetMocks);

			it('should not write empty catalogs', async () => {
				const code = 'console.log("Hello, world!")';
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					INPUTFILE: ['force-po1.js'],
				};
				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(0);
				expect(writeFileSync).not.toHaveBeenCalled();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});

			it('should write empty catalogs with option --force-po', async () => {
				const code = 'console.log("Hello, world!")';
				readFileSync.mockReturnValueOnce(Buffer.from(code));
				const argv = {
					...baseArgv,
					forcePo: true,
					INPUTFILE: ['force-po1.js'],
				};
				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect((writeFileSync.mock.calls[0] as string[])[1]).toMatchSnapshot();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});
		});

		describe('option --width', () => {
			beforeEach(resetMocks);

			it('should honor the option --width', async () => {
				const code = 'gtx._("For a very long time! For a very long time!")';
				readFileSync.mockReturnValue(Buffer.from(code));
				const argv = {
					...baseArgv,
					width: 25,
					INPUTFILE: ['width.js'],
				};
				const xgettext = new XGettext(baseConfig, date);
				expect(await xgettext.run(argv)).toEqual(0);
				expect(writeFileSync).toHaveBeenCalledTimes(1);
				expect((writeFileSync.mock.calls[0] as string[])[1]).toMatchSnapshot();
				expect(warnSpy).not.toHaveBeenCalled();
				expect(errorSpy).not.toHaveBeenCalled();
			});
		});
	});
});

describe('xgettext encodings', () => {
	describe('ascii', () => {
		beforeEach(resetMocks);

		it('should accept plain ascii by default', async () => {
			const code = 'gtx._("Hello, world!");';

			readFileSync.mockReturnValueOnce(Buffer.from(code));

			const argv = {
				...baseArgv,
				INPUTFILE: ['hello-ascii.js'],
			};
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(0);
			expect(writeFileSync).toHaveBeenCalledTimes(1);
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('should complain about 8 bit characters', async () => {
			const code = `
gtx._("Hello, world!");
`;
			// Replace o => ö (latin-1).
			const buf = Buffer.from(code).map(c => (c === 0x6f ? 0xf6 : c));
			readFileSync.mockReturnValueOnce(buf);

			const argv = {
				...baseArgv,
				INPUTFILE: ['hello-ascii.js'],
			};
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(1);
			expect(writeFileSync).toHaveBeenCalledTimes(0);
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy)
				.toHaveBeenCalledWith(`hello-ascii.js:2:12: Error: Non-ASCII character.
Please specify the encoding through "--from-code".`);
		});

		it('should accept 8 bit characters with iso-8859-1', async () => {
			const code = `
gtx._("Hello, world!");
`;
			// Replace o => ö (latin-1).
			const buf = Buffer.from(code).map(c => (c === 0x6f ? 0xf6 : c));
			readFileSync.mockReturnValueOnce(buf);

			const argv = {
				...baseArgv,
				fromCode: 'iso-8859-1',
				INPUTFILE: ['hello-ascii.js'],
			};
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(0);
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
			expect(writeFileSync).toHaveBeenCalledTimes(1);
			expect(writeFileSync.mock.calls[0]).toMatchSnapshot();
		});

		it('should accept ASCII-8bit as an alias for ASCII', async () => {
			const code = `gtx._("Hyvää yötä!")`;
			readFileSync.mockReturnValueOnce(Buffer.from(code));

			const argv = {
				...baseArgv,
				INPUTFILE: ['hyvää-yötä.js'],
			};
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(1);
			expect(writeFileSync).toHaveBeenCalledTimes(0);
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy)
				.toHaveBeenCalledWith(`hyvää-yötä.js:1:11: Error: Non-ASCII character.
Please specify the encoding through "--from-code".`);
		});

		it('should accept US-ASCII as an alias for ASCII', async () => {
			const code = `gtx._("Hyvää yötä!")`;
			readFileSync.mockReturnValueOnce(Buffer.from(code));

			const argv = {
				...baseArgv,
				fromCode: 'US-ASCII',
				INPUTFILE: ['hyvää-yötä.js'],
			};
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(1);
			expect(writeFileSync).toHaveBeenCalledTimes(0);
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy)
				.toHaveBeenCalledWith(`hyvää-yötä.js:1:11: Error: Non-ASCII character.
Please specify the encoding through "--from-code".`);
		});

		it('should accept ANSI_X3.4-1968 as an alias for ASCII', async () => {
			const code = `gtx._("Hyvää yötä!")`;
			readFileSync.mockReturnValueOnce(Buffer.from(code));

			const argv = {
				...baseArgv,
				fromCode: 'ANSI_X3.4-1968',
				INPUTFILE: ['hyvää-yötä.js'],
			};
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(1);
			expect(writeFileSync).toHaveBeenCalledTimes(0);
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy)
				.toHaveBeenCalledWith(`hyvää-yötä.js:1:11: Error: Non-ASCII character.
Please specify the encoding through "--from-code".`);
		});
	});

	describe('utf-8', () => {
		beforeEach(resetMocks);

		it('should accept valid utf-8', async () => {
			const code = `
gtx._('Hyvää, yötä!');
gtx._('Добро, утро!');
gtx._('😀');
gtx._('좋은 아침!');
// Some random chars for better test coverage.
gtx._('પ툈');
gtx._('񈈈􈈈');
`;
			const buf = Buffer.from(code);
			readFileSync.mockReturnValueOnce(buf);

			const argv = {
				...baseArgv,
				fromCode: 'utf-8',
				INPUTFILE: ['hello-ascii.js'],
			};
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(0);
			expect(writeFileSync).toHaveBeenCalledTimes(1);
			expect((writeFileSync.mock.calls[0] as string[])[1]).toMatchSnapshot();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('should complain about a lone 8-bit byte', async () => {
			const code = `
gtx._("Hello, world!");
`;
			// Replace o => ö (latin-1).
			const buf = Buffer.from(code).map(c => (c === 0x6f ? 0xf6 : c));
			readFileSync.mockReturnValueOnce(buf);

			const argv = {
				...baseArgv,
				fromCode: 'utf-8',
				INPUTFILE: ['hello-ascii.js'],
			};
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(1);
			expect(writeFileSync).toHaveBeenCalledTimes(0);
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenCalledWith(
				'hello-ascii.js:2:12: Error: invalid multibyte sequence',
			);
		});

		it('should complain about invalid charsets', async () => {
			const code = `
gtx._("Hello, world!");
`;
			const buf = Buffer.from(code);
			readFileSync.mockReturnValueOnce(buf);

			const argv = {
				...baseArgv,
				fromCode: 'no-such-charset',
				INPUTFILE: ['hello-ascii.js'],
			};
			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(1);
			expect(writeFileSync).toHaveBeenCalledTimes(0);
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledTimes(1);
		});

		it('should complain about invalid charsets converting standard input', async () => {
			const code = `
gtx._("Hello, world!");
`;

			const argv = {
				...baseArgv,
				fromCode: 'no-such-charset',
				language: 'javascript',
				INPUTFILE: ['-'],
			};
			const stdinSpy = jest
				.spyOn(global.process.stdin, 'read')
				.mockReturnValueOnce(Buffer.from(code));

			const xgettext = new XGettext(baseConfig, date);
			expect(await xgettext.run(argv)).toEqual(1);
			expect(stdinSpy).toHaveBeenCalledTimes(1);
			stdinSpy.mockReset();
			expect(writeFileSync).toHaveBeenCalledTimes(0);
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledTimes(1);
		});
	});
});
