import { spawn } from 'child_process';
import { Textdomain } from '@esgettext/runtime';
import { readFileSync as readJsonFileSync } from 'jsonfile';
import { Options } from '../cli/getopt';

/* eslint-disable no-console */

const gtx = Textdomain.getInstance('tools');

export class Install {
	private readonly locales: Array<string>;

	constructor(private readonly options: Options) {
		if (options._.length) {
			throw new Error(gtx._("no additional arguments allowed"));
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let pkg: any;

		if (typeof options.packageJson !== 'undefined') {
			pkg = readJsonFileSync(options.packageJson);
		}

		if (!options.locale) {
			options.locale = pkg.locales;
		}
		if (!options.locale || !options.locale.length) {
			throw new Error(gtx._("no locales given"))
		}

		if (options.outputFormat !== 'json' && options.outputFormat !== 'mo') {
			throw new Error(gtx._("only 'json' and 'mo' are allowed as output formats"))
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

	private installJsonLocale(_inFile: string, _outFile: string): Promise<number> {
		return new Promise<number>((_resolve, reject) => {
			reject('todo json');
		});
	}

	private installMoLocale(_inFile: string, _outFile: string): Promise<number> {
		return new Promise<number>((_resolve, reject) => {
			reject('todo mo');
		});
	}

	private installLocale(locale: string): Promise<number> {
		const directory = this.options.outputDirectory + '/' + locale + 'LC_MESSAGES';
		const outFile = directory + '/' + 'domain' + '.' + this.options.outputFormat;
		const inFile = this.options.directory + '/' + locale + '.' + this.options.inputFormat;

		if (this.options.outputFormat === 'json') {
			return this.installJsonLocale(inFile, outFile);
		} else {
			return this.installMoLocale(inFile, outFile);
		}
	}

	public run(): Promise<number> {
		return new Promise((resolve, reject) => {
			const promises: Array<Promise<number>> = [];

			for (let i = 0; i < this.locales.length; ++i) {
				const locale = this.locales[i];
				promises.push(this.installLocale(locale));
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
