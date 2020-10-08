import { renameSync, unlinkSync } from 'fs';
import { spawn } from 'child_process';
import { Textdomain } from '@esgettext/runtime';
import { readFileSync as readJsonFileSync } from 'jsonfile';
import { Options } from '../cli/getopt';

/* eslint-disable no-console */

const gtx = Textdomain.getInstance('tools');

export class MsgmergeAll {
	private readonly refPot: string;
	private readonly locales: Array<string>;

	constructor(private readonly options: Options) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let pkg: any = {};

		if (typeof options.packageJson !== 'undefined') {
			const p = readJsonFileSync(options.packageJson);
			if (p && p.esgettext) {
				pkg = p.esgettext;
			}
		}

		if (typeof options.directory === 'undefined') {
			if (pkg.directory.length) {
				options.directory = pkg.directory.length;
			} else {
				options.directory = '.';
			}
		}

		if (!options._.length && pkg.textdomain.length) {
			options._.push(options.directory + '/' + pkg.textdomain + '.pot');
		}

		if (!options._.length) {
			throw new Error(gtx._("no input file given"));
		} else if (options._.length !== 1) {
			throw new Error(gtx._("exactly one input file is required"));
		}

		if (!options.locale && pkg.locales) {
			options.locale = pkg.locales;
		}

		if (!options.locale || !options.locale.length) {
			throw new Error(gtx._("no locales given"))
		}

		this.locales = [];

		for (let i = 0; i < options.locale.length; ++i) {
			const locales = options.locale[i].split(/[ \t]*,[ \t]*/);
			for (let j = 0; j < locales.length; ++j) {
				this.locales.push(locales[j]);
			}
		}
	}

	private async msgmergeLocale(locale: string): Promise<number> {
		return new Promise((resolve, reject) => {
			const args: Array<string> = [];

			const poFile = this.options.directory + '/' + locale + '.po';
			const oldPoFile = this.options.directory + '/' + locale + '.old.po';

			renameSync(poFile, oldPoFile);

			if (this.options.options) {
				for (let j = 0; j < this.options.options.length; ++j) {
					args.push(this.options.options[j]);
				}
			}

			args.push(oldPoFile, this.refPot, '-o', poFile);

			const out: Array<[number, Buffer]> = [];

			const msgmerge = spawn(this.options.msgmerge, args, {
				windowsHide: true,
			});

			msgmerge.stdout.on('data', data => out.push([1, data.toString()]));
			msgmerge.stderr.on('data', data => out.push([2, data.toString()]));

			msgmerge.on('close', code => {
				if (this.options.verbose) {
					console.log(gtx._x("Merging '{pot}' into '{po}'.", {
						pot: this.refPot,
						po: poFile,
					}));
				}

				for (let i = 0; i < out.length; ++i) {
					const chunk = out[i];
					if (chunk[0] === 1) {
						console.log(chunk[1].toString());
					} else {
						console.error(chunk[1].toString());
					}
				}

				if (code) {
					reject(code)
				} else {
					unlinkSync(oldPoFile);
					resolve(0);
				}
			});

			msgmerge.on('error', err => {
				throw new Error(gtx._x("Failed to run '{prg}': {err}", {
					prg: this.options.msgmerge,
					err
				}));
			});
		})
	}

	public run(): Promise<number> {
		return new Promise(resolve => {
			const promises: Array<Promise<number>> = [];

			for (let i = 0; i < this.locales.length; ++i) {
				const locale = this.locales[i];
				promises.push(this.msgmergeLocale(locale));
			}

			Promise.all(promises)
			.then((codes) => {
				const failures = codes.filter(v => v !== 0);
				if (failures.length) {
					resolve(1);
				} else {
					resolve(0);
				}
			})
			.catch(() => {
				resolve(1);
			});
		});
	}
}
