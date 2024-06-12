import { unlinkSync } from 'fs';
import { spawn } from 'child_process';
import { Textdomain } from '@esgettext/runtime';
import { readFileSync as readJsonFileSync } from 'jsonfile';
import { Options } from '../cli/getopt';
import { EsgettextPackageJson, PackageJson } from '../esgettext-package-json';

/* eslint-disable no-console */

const gtx = Textdomain.getInstance('tools');

type MsgfmtAllOptions = {
	_: string[];
	packageJson?: string;
	locale?: string[];
	directory?: string;
	format: string;
	msgfmt: string;
	options: string[];
	verbose?: boolean;
};

export class MsgfmtAll {
	private readonly locales: Array<string>;
	private readonly options: MsgfmtAllOptions;

	constructor(cmdLineOptions: Options) {
		const options = cmdLineOptions as MsgfmtAllOptions;
		this.options = options;

		if (options._.length) {
			throw new Error(gtx._('no additional arguments allowed'));
		}

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

		if (!options.locale && pkg.locales) {
			options.locale = pkg.locales;
		}

		if (!options.locale || !options.locale.length) {
			throw new Error(gtx._('no locales given'));
		}

		if (typeof options.directory === 'undefined') {
			if (pkg.directory?.length) {
				options.directory = pkg.directory;
			} else {
				options.directory = '.';
			}
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
			const moFile =
				this.options.directory + '/' + locale + '.' + this.options.format;

			if (this.options.options) {
				for (let j = 0; j < this.options.options.length; ++j) {
					args.push(this.options.options[j]);
				}
			}

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
				const msgfmt = spawn(this.options.msgfmt, args, {
					windowsHide: true,
				});
				msgfmt.stdout.on('data', data => process.stdout.write(data.toString()));
				msgfmt.stderr.on('data', data => process.stderr.write(data.toString()));
				msgfmt.on('close', code => {
					if (code) {
						unlinkSync(moFile);
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
					unlinkSync(moFile);
				} catch (err1) {
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
			this.locales
				.reduce(
					(promise, locale) => promise.then(() => this.msgfmtLocale(locale)),
					Promise.resolve(),
				)
				.then(
					() => resolve(0),
					() => resolve(1),
				);
		});
	}
}
