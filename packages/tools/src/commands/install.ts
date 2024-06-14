import { copyFile, existsSync, readFileSync, writeFile } from 'fs';
import { Command } from '../command';
import { Textdomain, parseMoCatalog } from '@esgettext/runtime';
import yargs from 'yargs';
import { readFileSync as readJsonFileSync } from 'jsonfile';
import { EsgettextPackageJson, PackageJson } from '../esgettext-package-json';
import * as mkdirp from 'mkdirp';

type InstallOptions = {
	_: string[];
	packageJson?: string;
	locales?: string[];
	directory?: string;
	inputFormat: string;
	outputFormat: string;
	outputDirectory: string;
	options: string[];
	verbose?: boolean;
};

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');

export class Install implements Command {
	private locales: Array<string>;
	private options: InstallOptions;

	synopsis(): string {
		return gtx._('[OPTIONS]');
	}

	description(): string {
		return gtx._('Install translation catalogs.');
	}

	args(): { [key: string]: yargs.Options } {
		return {
			'package-json': {
				type: 'boolean',
				describe: gtx._('Read package information from this file'),
				default: 'package.json',
				group: gtx._('Input file options:'),
			},
			locales: {
				alias: 'l',
				type: 'array',
				describe: gtx._('List of locale identifiers'),
				demandOption: true,
				group: gtx._('Input file options:'),
			},
			directory: {
				alias: 'D',
				type: 'string',
				describe: gtx._('Where to search message catalog files'),
				default: '.',
				group: gtx._('Input file options:'),
			},
			'input-format': {
				type: 'string',
				describe: gtx._('Input file type'),
				default: 'gmo',
				group: gtx._('Input file options:'),
			},
			'output-directory': {
				type: 'string',
				describe: gtx._('Output directory'),
				default: 'assets/locale',
				group: gtx._('Output file options:'),
			},
			'output-format': {
				type: 'string',
				describe: gtx._('Output format'),
				default: 'mo.json',
				choices: ['mo.json', 'json', 'mo'],
				group: gtx._('Output file options:'),
			},
			verbose: {
				alias: 'V',
				type: 'boolean',
				describe: gtx._('Enable verbose output'),
			},
		};
	}

	init(argv: yargs.Arguments) {
		const options = argv as unknown as InstallOptions;
		this.options = options;

		let pkg = {} as EsgettextPackageJson;

		if (typeof options.packageJson !== 'undefined') {
			const filename = options.packageJson.length
				? options.packageJson
				: 'package.json';
			const p = readJsonFileSync(filename) as PackageJson;
			if (p && p.esgettext) {
				pkg = p.esgettext as unknown as EsgettextPackageJson;
			}
		}

		if (!options.locales && pkg.locales) {
			options.locales = pkg.locales;
		}

		if (!options.locales || !options.locales.length) {
			throw new Error(gtx._('no locales given'));
		}

		if (options.outputFormat !== 'mo.json'
		    && options.outputFormat !== 'mo'
		    && options.outputFormat !== 'json') {
			throw new Error(
				gtx._("only 'mo.json', 'mo', and 'json' are allowed as output formats!"),
			);
		}

		if (typeof options.directory === 'undefined') {
			if (pkg.directory?.length) {
				options.directory = pkg.directory;
			} else {
				options.directory = '.';
			}
		}

		this.locales = [];

		for (let i = 0; i < options.locales.length; ++i) {
			const locales = options.locales[i].split(/[ \t]*,[ \t]*/);
			for (let j = 0; j < locales.length; ++j) {
				this.locales.push(locales[j]);
			}
		}

		return this;
	}

	public run(): Promise<number> {
		return new Promise(resolve => {
			const promises: Array<Promise<number>> = [];

			for (let i = 0; i < this.locales.length; ++i) {
				const locale = this.locales[i];
				promises.push(this.installLocale(locale));
			}

			Promise.all(promises)
				.then(codes => {
					const failures = codes.filter(v => v !== 0);
					if (failures.length) {
						resolve(1);
					} else {
						resolve(0);
					}
				})
				.catch(err => {
					console.error(err);
					resolve(1);
				});
		});
	}

	private installMoLocale(inFile: string, outFile: string): Promise<number> {
		return new Promise<number>(resolve => {
			if (this.options.verbose) {
				console.log(
					gtx._x("Installing '{inFile}' as '{outFile}' ...", {
						inFile,
						outFile,
					}),
				);
			}

			copyFile(inFile, outFile, err => {
				if (err) {
					throw err;
				} else {
					resolve(0);
				}
			});
		});
	}

	private installMoJsonLocale(inFile: string, outFile: string): Promise<number> {
		return new Promise<number>(resolve => {
			if (this.options.verbose) {
				console.log(
					gtx._x("Compiling '{inFile}' into '{outFile}' ...", {
						inFile,
						outFile,
					}),
				);
			}

			const input = readFileSync(inFile);
			const catalog = parseMoCatalog(input);
			const json = JSON.stringify(catalog);

			writeFile(outFile, json, err => {
				if (err) {
					console.error(gtx._x("{outfile}: write error: {err}", {
						outFile, err,
					}));
					resolve(1);
				} else {
					resolve(0);
				}
			});
		});
	}

	private installJsonLocale(inFile: string, outFile: string): Promise<number> {
		return new Promise<number>(resolve => {
			if (this.options.verbose) {
				console.log(
					gtx._x("Compiling '{inFile}' into '{outFile}' ...", {
						inFile,
						outFile,
					}),
				);
			}

			const input = readFileSync(inFile);
			const catalog = parseMoCatalog(input);
			const msgs: { [msgid: string]: string } = {};
			for (const msgid in catalog.entries) {
				const msgstr = catalog.entries[msgid];
				if (msgstr.length > 1) {
					console.error(gtx._x("{inFile}: plural expressions are not allowed for '.json' output!", { inFile }));
					resolve(1);
					return;
				}
				msgs[msgid] = msgstr[0];
			}

			const json = JSON.stringify(msgs);

			writeFile(outFile, json, err => {
				if (err) {
					console.error(gtx._x("{outfile}: write error: {err}", {
						outFile, err,
					}));
					resolve(1);
				} else {
					resolve(0);
				}
			});
		});
	}

	private installLocale(locale: string): Promise<number> {
		try {
			const directory =
				this.options.outputDirectory + '/' + locale + '/LC_MESSAGES';
			const outFile =
				directory + '/' + 'domain' + '.' + this.options.outputFormat;
			const inFile =
				this.options.directory + '/' + locale + '.' + this.options.inputFormat;

			if (!existsSync(directory)) {
				mkdirp.sync(directory);
			}

			if (this.options.outputFormat === 'mo.json') {
				return this.installMoJsonLocale(inFile, outFile);
			} else if (this.options.outputFormat === 'json') {
				return this.installJsonLocale(inFile, outFile);
			} else {
				return this.installMoLocale(inFile, outFile);
			}
		} catch (err) {
			console.error(err);
			throw err;
		}
	}
}
