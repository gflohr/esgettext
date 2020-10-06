import { spawn } from 'child_process';
import { Textdomain } from '@esgettext/runtime';
import { readFileSync as readJsonFileSync } from 'jsonfile';
import { Options } from '../cli/getopt';

/* eslint-disable no-console */

const gtx = Textdomain.getInstance('tools');

export class MsgfmtAll {
	private readonly locales: Array<string>;

	constructor(private readonly options: Options) {
		if (options._.length) {
			throw new Error(gtx._("no additional arguments allowed"));
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let pkg: any = {};

		if (typeof options.packageJson !== 'undefined') {
			pkg = readJsonFileSync(options.packageJson);
		}

		if (!options.locale) {
			options.locale = pkg.locales;
		}

		if (!options.locale || !options.locale.length) {
			throw new Error(gtx._("no locales given"))
		}

		if (typeof options.directory === 'undefined') {
			options.directory = '.';
		}

		this.locales = [];

		for (let i = 0; i < options.locale.length; ++i) {
			const locales = options.locale[i].split(/[ \t]*,[ \t]*/);
			for (let j = 0; j < locales.length; ++j) {
				this.locales.push(locales[j]);
			}
		}
	}

	private async msgfmtLocale(locale: string): Promise<number> {
		return new Promise((resolve, reject) => {
			const args: Array<string> = [];

			const poFile = this.options.directory + '/' + locale + '.po';
			const moFile = this.options.directory + '/' + locale + '.' + this.options.format;

			if (this.options.options) {
				for (let j = 0; j < this.options.options.length; ++j) {
					args.push(this.options.options[j]);
				}
			}

			args.push('-o', moFile, poFile);

			const out: Array<[number, Buffer]> = [];

			const msgfmt = spawn(this.options.msgfmt, args, {
				windowsHide: true,
			});

			msgfmt.stdout.on('data', data => out.push([1, data.toString()]));
			msgfmt.stderr.on('data', data => out.push([2, data.toString()]));

			msgfmt.on('close', code => {
				console.log(gtx._x("Compiling '{po}' into '{mo}'.", {
					po: poFile,
					mo: moFile,
				}));

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
					resolve(0);
				}
			});

			msgfmt.on('error', err => {
				throw new Error(gtx._x("Failed to run '{prg}': {err}", {
					prg: this.options.msgfmt,
					err
				}));
			});
		})
	}

	public run(): Promise<number> {
		return new Promise((resolve, reject) => {
			const promises: Array<Promise<number>> = [];

			for (let i = 0; i < this.locales.length; ++i) {
				const locale = this.locales[i];
				promises.push(this.msgfmtLocale(locale));
			}

			Promise.all(promises)
			.then((codes) => {
				const failures = codes.filter(v => v !== 0);
				if (failures.length) {
					reject(1);
				} else {
					resolve(0);
				}
			})
			.catch(() => {
				reject(1);
			});
		});
	}
}
