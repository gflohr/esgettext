import { copyFile, existsSync, readFileSync, writeFile } from 'fs';
import { readFileSync as readJsonFileSync } from 'jsonfile';
import * as mkdirp from 'mkdirp';
import { Textdomain } from '@esgettext/runtime';
import { Options } from '../cli/getopt';
import { parseMoCatalog } from '../../../runtime/lib';
import { EsgettextPackageJson, PackageJson } from '../esgettext-package-json';

/* eslint-disable no-console */

const gtx = Textdomain.getInstance('tools');

type InstallOptions = {
	_: string[];
	packageJson?: string;
	locale?: string[];
	directory?: string;
	inputFormat: string;
	outputFormat: string;
	outputDirectory: string;
	options: string[];
	verbose?: boolean;
};

export class Install {
	private readonly locales: Array<string>;
	private readonly options: InstallOptions;

	constructor(cmdLineOptions: Options) {
		const options = cmdLineOptions as InstallOptions;
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

		if (options.outputFormat !== 'json' && options.outputFormat !== 'mo') {
			throw new Error(
				gtx._("only 'json' and 'mo' are allowed as output formats"),
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

		for (let i = 0; i < options.locale.length; ++i) {
			const locales = options.locale[i].split(/[ \t]*,[ \t]*/);
			for (let j = 0; j < locales.length; ++j) {
				this.locales.push(locales[j]);
			}
		}
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
			const json = JSON.stringify(catalog);

			writeFile(outFile, json, err => {
				if (err) {
					throw err;
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

			if (this.options.outputFormat === 'json') {
				return this.installJsonLocale(inFile, outFile);
			} else {
				return this.installMoLocale(inFile, outFile);
			}
		} catch (err) {
			console.error(err);
			throw err;
		}
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
}
