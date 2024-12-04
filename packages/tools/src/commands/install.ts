import { copyFile, existsSync, readFileSync, writeFile } from 'fs';
import { Command } from '../command';
import { Textdomain, parseMoCatalog } from '@esgettext/runtime';
import yargs from 'yargs';
import * as mkdirp from 'mkdirp';
import { Configuration } from '../configuration';
import { OptSpec, coerceOptions } from '../optspec';

type InstallOptions = {
	_: string[];
	locales?: string[];
	directory?: string;
	inputFormat: string;
	outputFormat: string;
	defaultDomain: string;
	outputDirectory: string;
	options: string[];
	verbose?: boolean;
};

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');

export class Install implements Command {
	private locales: Array<string> = undefined as unknown as Array<string>;
	private options: InstallOptions = undefined as unknown as InstallOptions;
	private readonly configuration: Configuration;

	constructor(configuration: Configuration) {
		this.configuration = configuration;
	}

	synopsis(): string {
		return `[${gtx._('OPTIONS')}]`;
	}

	description(): string {
		return gtx._('Install translation catalogs.');
	}

	aliases(): Array<string> {
		return [];
	}

	args(): { [key: string]: OptSpec } {
		return {
			locales: {
				multi: true,
				alias: 'l',
				describe: gtx._('List of locale identifiers'),
				demandOption: true,
				default: this.configuration.po?.locales,
				group: gtx._('Input file options:'),
			},
			directory: {
				alias: 'D',
				type: 'string',
				describe: gtx._('Where to search message catalog files'),
				default: this.configuration.po?.directory ?? '.',
				group: gtx._('Input file options:'),
			},
			'input-format': {
				type: 'string',
				describe: gtx._('Input file type'),
				default: 'gmo',
				choices: ['gmo', 'mo'],
				group: gtx._('Input file options:'),
			},
			'default-domain': {
				type: 'string',
				describe: gtx._('The textdomain to use'),
				default: this.configuration.package?.textdomain,
				group: gtx._('Output file options'),
			},
			'output-directory': {
				type: 'string',
				describe: gtx._('Output directory'),
				default: this.configuration.install?.directory ?? 'src/locale',
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	additional(_: yargs.Argv) {}

	private init(argv: yargs.Arguments) {
		const options = argv as unknown as InstallOptions;
		this.options = options;
		const conf = this.configuration;

		if (!options.locales && this.configuration.po?.locales) {
			options.locales = conf.po?.locales;
		}

		if (!options.locales || !options.locales.length) {
			throw new Error(gtx._('no locales given'));
		}

		if (
			options.outputFormat !== 'mo.json' &&
			options.outputFormat !== 'mo' &&
			options.outputFormat !== 'json'
		) {
			throw new Error(
				gtx._(
					"only 'mo.json', 'mo', and 'json' are allowed as output formats!",
				),
			);
		}

		if (typeof options.directory === 'undefined') {
			if (conf.po?.directory?.length) {
				options.directory = conf.po.directory;
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
	}

	public run(argv: yargs.Arguments): Promise<number> {
		return new Promise(resolve => {
			if (!coerceOptions(argv, this.args())) {
				return resolve(1);
			}

			this.init(argv);

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

	private installMoJsonLocale(
		inFile: string,
		outFile: string,
	): Promise<number> {
		return new Promise<number>(resolve => {
			if (this.options.verbose) {
				console.log(
					gtx._x("Compiling '{inFile}' into '{outFile}' ...", {
						inFile,
						outFile,
					}),
				);
			}

			const buffer = readFileSync(inFile);
			const arrayBuffer: ArrayBuffer = (buffer.buffer as ArrayBuffer).slice(
				buffer.byteOffset,
				buffer.byteOffset + buffer.byteLength,
			);
			const catalog = parseMoCatalog(arrayBuffer);
			const json = JSON.stringify(catalog);

			writeFile(outFile, json, err => {
				if (err) {
					console.error(
						gtx._x('{outfile}: Write error: {err}', {
							outFile,
							err,
						}),
					);
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

			const buffer = readFileSync(inFile);
			const arrayBuffer: ArrayBuffer = (buffer.buffer as ArrayBuffer).slice(
				buffer.byteOffset,
				buffer.byteOffset + buffer.byteLength,
			);
			const catalog = parseMoCatalog(arrayBuffer);
			const msgs: { [msgid: string]: string } = {};
			for (const msgid in catalog.entries) {
				const msgstr = catalog.entries[msgid];
				if (msgstr.length > 1) {
					console.error(
						gtx._x(
							"{inFile}: plural expressions are not allowed for '.json' output!",
							{ inFile },
						),
					);
					resolve(1);
					return;
				}
				msgs[msgid] = msgstr[0];
			}

			const json = JSON.stringify(msgs);

			writeFile(outFile, json, err => {
				if (err) {
					console.error(
						gtx._x('{outfile}: Write error: {err}', {
							outFile,
							err,
						}),
					);
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
				directory +
				'/' +
				this.options.defaultDomain +
				'.' +
				this.options.outputFormat;
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
