import yargs from 'yargs';
import * as fs from 'fs';
import { input, select } from '@inquirer/prompts';
import { Command } from '../command';
import { Textdomain } from '@esgettext/runtime';
import { Configuration } from '../configuration';
import { Package } from '../package';

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');

type InitOptions = {
	_: string[];
	force: boolean;
	dryRun: boolean;
	verbose?: boolean;
	[key: string]: string | string[] | boolean | undefined;
};

type ConfigFile =
	| 'esconfig.mjs'
	| 'esconfig.cjs'
	| 'esconfig.json'
	| 'package.json';

type Setup = {
	textdomain: string;
	poDirectory: string;
	localeDirectory: string;
	packageManager: string;
	configFile: ConfigFile;
};

type PackageJson = {
	name?: string;
	version?: string;
	type?: 'module' | 'commonjs';
	module?: boolean;
	bugs?: {
		url?: string;
		email?: string;
	};
	esgettext: Configuration;
};

export class Init implements Command {
	private options: InitOptions = undefined as unknown as InitOptions;
	private readonly configuration: Configuration;
	private readonly packageJson: PackageJson;
	private readonly indentWithSpaces: boolean;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(configuration: Configuration) {
		this.configuration = configuration;

		if (!fs.existsSync('package.json')) {
			console.error(
				gtx._x(
					"{programName}: No 'package.json' found. Please run 'npm init' first!",
					{
						programName: Package.getName(),
					},
				),
			);
			process.exit(1);
		}

		const json = fs.readFileSync('package.json', { encoding: 'utf-8' });
		this.indentWithSpaces = json.match(/ /) ? true : false;
		try {
			this.packageJson = JSON.parse(json);
		} catch (error) {
			console.error(
				gtx._x('{programName}: Error: {filename}: {error}', {
					programName: Package.getName(),
					filename: 'package.json',
					error,
				}),
			);
			process.exit(1);
		}
	}

	synopsis(): string {
		return '';
	}

	description(): string {
		return gtx._('Prepare a package to use esgettext.');
	}

	aliases(): Array<string> {
		return [];
	}

	args(): { [key: string]: yargs.Options } {
		return {
			force: {
				alias: 'f',
				type: 'boolean',
				describe: gtx._('Overwrite existing files.'),
			},
			'dry-run': {
				alias: 'n',
				type: 'boolean',
				describe: gtx._(
					'Just print what would be done without writing anything; implies --verbose.',
				),
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
		const options = argv as unknown as InitOptions;
		this.options = options;

		if (this.options.dryRun) this.options.verbose = true;
	}

	public async doRun(): Promise<number> {
		await this.promptUser();

		return 0;
	}

	public run(argv: yargs.Arguments): Promise<number> {
		this.init(argv);

		return new Promise(resolve => {
			this.doRun()
				.then(() => {
					resolve(0);
				})
				.catch(() => {
					resolve(1);
				});
		});
	}

	private nonEmpty(answer: string): Promise<boolean | string> {
		return new Promise(resolve => {
			if (answer.trim().length === 0) {
				return resolve(
					gtx._('Please enter a string with at least one character!'),
				);
			} else {
				return resolve(true);
			}
		});
	}

	private checkDirectory(answer: string): Promise<boolean | string> {
		return new Promise(resolve => {
			const directory = answer.trim();
			if (directory.length === 0) {
				return resolve(
					gtx._('Please enter a string with at least one character!'),
				);
			}

			if (!this.options.force) {
				if (fs.existsSync(directory)) {
					return resolve(
						gtx._x("The directory '{directory}' already exists!", {
							directory,
						}),
					);
				}
			}

			return resolve(true);
		});
	}

	private guessPackageManager(): 'npm' | 'yarn' | 'pnpm' | 'bun' {
		if (fs.existsSync('package-lock.json')) {
			return 'npm';
		} else if (fs.existsSync('yarn.lock')) {
			return 'yarn';
		} else if (fs.existsSync('pnpm-lock.yaml')) {
			return 'pnpm';
		} else if (fs.existsSync('bun.lockb')) {
			return 'bun';
		} else {
			return 'npm';
		}
	}

	private guessLocaleDir(): string {
		if (fs.existsSync('assets')) {
			return 'assets/locale';
		} else if (fs.existsSync('src')) {
			return 'src/locale';
		} else {
			return 'assets/locale';
		}
	}

	private guessConfigFile(): ConfigFile {
		if (this.packageJson.type === 'module' || this.packageJson.module) {
			return 'esconfig.mjs';
		} else if (this.packageJson.type === 'commonjs') {
			return 'esconfig.cjs';
		} else {
			return 'esconfig.json';
		}
	}

	private async promptUser(): Promise<Setup> {
		console.log(
			'⚡ ' +
				gtx._("We'll prepare your package for esgettext in a few seconds."),
		);
		console.log('🤔 ¯\\_(ツ)_/¯ ' + gtx._('In doubt, just hit return!'));
		console.log();
		return {
			textdomain: await input({
				message: gtx._('Textdomain of your package'),
				default: this.configuration.package?.name,
				validate: answer => this.nonEmpty(answer),
			}),
			poDirectory: await input({
				message: gtx._('Where to store translation files'),
				default: 'po',
				validate: answer => this.checkDirectory(answer),
			}),
			localeDirectory: await input({
				message: gtx._('Where to store compiled translations'),
				default: this.guessLocaleDir(),
				validate: answer => this.checkDirectory(answer),
			}),
			packageManager: await select({
				message: gtx._('Which package manager should be used'),
				choices: [
					{
						name: 'npm',
						value: 'npm',
					},
					{
						name: 'yarn',
						value: 'yarn',
					},
					{
						name: 'pnpm',
						value: 'pnpm',
					},
					{
						name: 'bun',
						value: 'bun',
					},
				],
				default: this.guessPackageManager(),
			}),
			configFile: await select({
				message: gtx._('Which package manager should be used'),
				choices: [
					{
						name: 'esconfig.mjs',
						value: 'esconfig.mjs',
					},
					{
						name: 'esconfig.cjs',
						value: 'esconfig.cjs',
					},
					{
						name: 'esconfig.json',
						value: 'esconfig.json',
					},
					{
						name: 'package.json',
						value: 'package.json',
					},
				],
				default: this.guessConfigFile(),
			}),
		};
	}
}
