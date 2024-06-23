import * as fs from 'fs';
import * as childProcess from 'child_process';
import { Command } from '../command';
import { Textdomain } from '@esgettext/runtime';
import yargs from 'yargs';
import { Configuration } from '../configuration';
import { Package } from '../package';
import { OptSpec, coerceOptions } from '../optspec';

interface MsgfmtAllOptions {
	_: string[];
	locales: string[];
	directory: string;
	format: string;
	msgfmt: string;
	options: string[];
	verbose: boolean;
	[key: string]: string[] | string | boolean;
}

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');

export class MsgfmtAll implements Command {
	private locales: Array<string> = undefined as unknown as Array<string>;
	private options: MsgfmtAllOptions = undefined as unknown as MsgfmtAllOptions;
	private readonly configuration: Configuration;

	constructor(configuration: Configuration) {
		this.configuration = configuration;
	}

	synopsis(): string {
		return '';
	}

	description(): string {
		return gtx._("Invoke 'msgfmt' for multiple files.");
	}

	aliases(): Array<string> {
		return [];
	}

	args(): { [key: string]: OptSpec } {
		const options = {
			locales: {
				multi: true,
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
			format: {
				type: 'string',
				describe: gtx._('Output file format'),
				default: 'gmo',
				group: gtx._('Output file options:'),
			},
			msgfmt: {
				type: 'string',
				describe: gtx._x("'{program}' program if not in $PATH", {
					program: 'msgfmt',
				}),
				default: this.configuration.programs?.msgfmt?.path ?? 'msgfmt',
				group: gtx._('Mode of operation:'),
			},
			options: {
				multi: true,
				type: 'string',
				describe: gtx._x(
					"Options to pass to '{program}' program (without leading hyphens)",
					{ program: 'msgfmt' },
				),
				default: this.configuration.programs?.msgfmt?.options || [
					'check',
					'statistics',
					'verbose',
				],
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	additional(_: yargs.Argv) {}

	private init(argv: yargs.Arguments) {
		const options = argv as unknown as MsgfmtAllOptions;
		this.options = options;
		const conf = this.configuration;

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
		return new Promise(resolve => {
			if (!coerceOptions(argv, this.args())) {
				return resolve(1);
			}

			this.init(argv);
			const promises = this.locales.map(locale => this.msgfmtLocale(locale));

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
							"{programName}: option '{option}': Options passed to '{program}' must be given without leading hyphens",
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

	private async msgfmtLocale(locale: string): Promise<number> {
		return new Promise(resolve => {
			const args = this.convertOptions(this.options.options);
			if (!args) return resolve(1);

			const poFile = this.options.directory + '/' + locale + '.po';
			const moFile =
				this.options.directory + '/' + locale + '.' + this.options.format;

			args.push('-o', moFile, poFile);
			if (this.options.verbose) {
				console.log(
					gtx._x("Compiling '{po}' into '{mo}'.", {
						po: poFile,
						mo: moFile,
					}),
				);
			}

			try {
				const msgfmt = childProcess.spawn(this.options.msgfmt, args, {
					windowsHide: true,
				});
				msgfmt.stdout.on('data', (data: string) =>
					process.stdout.write(data.toString()),
				);
				msgfmt.stderr.on('data', (data: string) =>
					process.stderr.write(data.toString()),
				);
				msgfmt.on('close', code => {
					if (code) {
						fs.unlinkSync(moFile);
						resolve(1);
					} else {
						resolve(0);
					}
				});

				msgfmt.on('error', err => {
					throw new Error(
						gtx._x("Failed to run '{prg}': {err}", {
							prg: this.options.msgfmt,
							err,
						}),
					);
				});
			} catch (err) {
				try {
					fs.unlinkSync(moFile);
				} catch (err1) {
					console.error(err1);
				}
				console.error(err);
				resolve(1);
			}
		});
	}
}
