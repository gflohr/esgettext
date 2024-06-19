import * as path from 'path';
import * as fs from 'fs';
import * as childProcess from 'child_process';
import { Command } from '../command';
import { Textdomain } from '@esgettext/runtime';
import yargs from 'yargs';
import { Configuration } from '../configuration';
import { Package } from '../package';

interface MsgmergeAllOptions {
	_: string[];
	locales: string[];
	directory: string;
	msgmerge: string;
	options: string[];
	verbose: boolean;
	[key: string]: string[] | string | boolean;
}

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');

export class MsgmergeAll implements Command {
	private locales: Array<string> = [];
	private options: MsgmergeAllOptions = {} as unknown as MsgmergeAllOptions;
	private readonly configuration: Configuration;
	private potfile?: string;

	constructor(configuration: Configuration) {
		this.configuration = configuration;

		if (
			configuration.package?.textdomain &&
			typeof configuration.po?.directory !== 'undefined'
		) {
			const filename = `${configuration.package.textdomain}.pot`;
			const potfile = path.join(configuration.po.directory, filename);
			if (fs.existsSync(potfile)) {
				this.potfile = potfile;
			}
		}
	}

	synopsis(): string {
		if (typeof this.potfile === 'undefined') {
			return `<${gtx._('POTFILE')}>`;
		} else {
			return `[${gtx._('POTFILE')}]`;
		}
	}

	description(): string {
		return gtx._("Invoke 'msgmerge' for multiple files.");
	}

	aliases(): Array<string> {
		return [];
	}

	args(): { [key: string]: yargs.Options } {
		const options = {
			locales: {
				alias: 'l',
				type: 'array',
				describe: gtx._('List of locale identifiers'),
				demandOption: true,
				default: this.configuration.po?.locales,
				group: gtx._('Input file options:'),
			},
			directory: {
				alias: 'D',
				type: 'string',
				describe: gtx._("Search '.po' files in DIRECTORY"),
				default: this.configuration.po?.directory ?? '.',
				group: gtx._('Input file options:'),
			},
			msgmerge: {
				type: 'string',
				describe: gtx._('msgmerge program if not in PATH [string]'),
				default: this.configuration.programs?.msgmerge?.path ?? 'msgmerge',
				group: gtx._('Mode of operation:'),
			},
			options: {
				type: 'string',
				array: true,
				describe: gtx._x(
					"Options to pass to '{program}' program (without hyphens)",
					{ program: 'msgmerge' },
				),
				default: this.configuration.programs?.msgfmt?.options,
				group: gtx._('Mode of operation:'),
			},
			verbose: {
				alias: 'V',
				type: 'boolean',
				describe: gtx._('Enable verbose output'),
			},
		} as { [key: string]: yargs.Options };

		for (const name of ['locales', 'options']) {
			if (!options[name].default) {
				delete options[name].default;
			}
		}

		return options;
	}

	additional(argv: yargs.Argv) {
		argv.positional(gtx._('POTFILE'), {
			type: 'string',
			describe: gtx._('Catalog file with up-to-date message ids'),
			default: this.potfile,
		});
	}

	private init(argv: yargs.Arguments) {
		const options = argv as unknown as MsgmergeAllOptions;
		this.options = options;
		const conf = this.configuration;

		this.potfile = options[gtx._('POTFILE')] as unknown as string;

		if (!options.locales && conf.po?.locales) {
			options.locales = conf.po?.locales;
		}

		if (!options.locales || !options.locales.length) {
			throw new Error(gtx._('no locales given'));
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
		this.init(argv);

		return new Promise(resolve => {
			const promises = this.locales.map(locale => this.msgmergeLocale(locale));

			Promise.all(promises)
				.then(results => {
					const hasOne = results.some(result => result === 1);

					resolve(hasOne ? 1 : 0);
				})
				.catch(() => {
					resolve(1);
				});
		});
	}

	private convertOptions(options: Array<string>): Array<string> | null {
		const msgmergeOptions: Array<string> = [];
		let errors = 0;
		if (options) {
			options.forEach(name => {
				if (name.substring(0, 1) === '-') {
					console.error(
						gtx._x(
							"{programName}: option '{option}': Options passed to '{program}' must not start with a hyphen",
							{
								programName: Package.getName(),
								program: 'msgfmt',
								option: name,
							},
						),
					);
					++errors;
				}

				if (name.length > 1) {
					msgmergeOptions.push(`--${name}`);
				} else if (name.length === 1) {
					msgmergeOptions.push(`-${name}`);
				}
			});
		}

		return errors ? null : msgmergeOptions;
	}

	private async msgmergeLocale(locale: string): Promise<number> {
		return new Promise(resolve => {
			const args = this.convertOptions(this.options.options);
			if (!args) return resolve(1);

			const poFile = this.options.directory + '/' + locale + '.po';
			const oldPoFile = this.options.directory + '/' + locale + '.old.po';

			args.push(oldPoFile, this.potfile as string, '-o', poFile);
			console.log(
				gtx._x("Merging '{pot}' into '{po}'.", {
					pot: this.potfile as string,
					po: poFile,
				}),
			);

			try {
				fs.renameSync(poFile, oldPoFile);
				const msgmerge = childProcess.spawn(this.options.msgmerge, args, {
					windowsHide: true,
				});
				msgmerge.on('error', err => {
					throw new Error(
						gtx._x("Failed to run '{prg}': {err}", {
							prg: this.options.msgmerge,
							err,
						}),
					);
				});
				msgmerge.stdout.on('data', (data: Buffer) =>
					process.stdout.write(data.toString()),
				);
				msgmerge.stderr.on('data', (data: Buffer) =>
					process.stderr.write(data.toString()),
				);
				msgmerge.on('close', code => {
					if (code) {
						fs.renameSync(oldPoFile, poFile);
						resolve(1);
					} else {
						fs.unlinkSync(oldPoFile);
						resolve(0);
					}
				});
			} catch (err) {
				try {
					fs.renameSync(oldPoFile, poFile);
				} catch (err1) {
					console.error(err1);
				}
				console.error(err);
				resolve(1);
			}
		});
	}
}
