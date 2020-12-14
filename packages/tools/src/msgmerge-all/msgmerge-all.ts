import { renameSync, unlinkSync } from 'fs';
import { spawn } from 'child_process';
import { join } from 'path';
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
			const filename = options.packageJson.length ? options.packageJson : 'package.json';
			const p = readJsonFileSync(filename);
			if (p && p.esgettext) {
				pkg = p.esgettext;
			}
		}

		if (typeof options.directory === 'undefined') {
			if (pkg.directory.length) {
				options.directory = pkg.directory;
			} else {
				options.directory = '.';
			}
		}

		if (!options._.length && pkg.textdomain.length) {
			options._.push(join(options.directory, pkg.textdomain + '.pot'));
		}

		if (!options._.length) {
			throw new Error(gtx._("no input file given"));
		} else if (options._.length !== 1) {
			throw new Error(gtx._("exactly one input file is required"));
		}

		this.refPot = this.options._[0];

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
		return new Promise(resolve => {
			const args: Array<string> = [];

			const poFile = this.options.directory + '/' + locale + '.po';
			const oldPoFile = this.options.directory + '/' + locale + '.old.po';

			if (this.options.options) {
				for (let j = 0; j < this.options.options.length; ++j) {
					args.push(this.options.options[j]);
				}
			}

			args.push(oldPoFile, this.refPot, '-o', poFile);
			if (this.options.verbose) {
				process.stdout.write(gtx._x("Merging '{pot}' into '{po}'.", {
					pot: this.refPot,
					po: poFile,
				}));
			}

			try {
				renameSync(poFile, oldPoFile);
				const msgmerge = spawn(this.options.msgmerge, args, {
					windowsHide: true,
				});
				msgmerge.on('error', err => {
					throw new Error(gtx._x("Failed to run '{prg}': {err}", {
						prg: this.options.msgmerge,
						err
					}));
				});
				msgmerge.stdout.on('data', data => process.stdout.write(data.toString()));
				msgmerge.stderr.on('data', data => process.stderr.write(data.toString()));
				msgmerge.on('close', code => {
					if (code) {
						renameSync(oldPoFile, poFile);
						resolve(1)
					} else {
						unlinkSync(oldPoFile);
						resolve(0);
					}
				});
			} catch(err) {
				try {
					renameSync(oldPoFile, poFile);
				} catch(err1) {
					console.error(err1);
				}
				console.error(err);
				resolve(1);
			}
		});
	}

	public run(): Promise<number> {
		return new Promise(resolve => {
			// We merge one locale at a time.  It would be more efficient to
			// do everything asynchronously but that makes error recovery
			// too hard.
			this.locales.reduce(
				(promise, locale) => promise.then(
					() => this.msgmergeLocale(locale)
				), Promise.resolve())
			.then(
				() => resolve(0),
				() => resolve(1),
			);
		});
	}
}
