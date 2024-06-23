import yargs from 'yargs';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as child_process from 'child_process';
import * as mkdirp from 'mkdirp';
import { input, select } from '@inquirer/prompts';
import { globSync } from 'glob';
import { Command } from '../command';
import { Textdomain } from '@esgettext/runtime';
import {
	Configuration,
	ConfigurationFactory,
	PackageJson,
} from '../configuration';
import NPMCliPackageJson from '@npmcli/package-json';
import { Package } from '../package';
import { OptSpec, coerceOptions } from '../optspec';

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');

type InitOptions = {
	_: string[];
	force: boolean;
	dryRun: boolean;
	verbose?: boolean;
	[key: string]: string | string[] | boolean | undefined;
};

type ConfigFile =
	| 'esgettext.config.mjs'
	| 'esgettext.config.cjs'
	| 'esgettext.config.json'
	| 'package.json';

type Setup = {
	textdomain: string;
	poDirectory: string;
	localeDirectory: string;
	packageManager: string;
	configFile: ConfigFile;
	msgmerge: string;
	msgmergeOptions: string;
	msgfmt: string;
	msgfmtOptions: string;
};

export class Init implements Command {
	private options: InitOptions = undefined as unknown as InitOptions;
	private readonly configuration: Configuration;
	private packageJson = undefined as unknown as PackageJson;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(configuration: Configuration) {
		this.configuration = configuration;
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

	args(): { [key: string]: OptSpec } {
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

	private async init(argv: yargs.Arguments) {
		const options = argv as unknown as InitOptions;
		this.packageJson = await ConfigurationFactory.getPackageJson();

		this.options = options;

		if (this.options.dryRun) this.options.verbose = true;
	}

	private setPrograms(config: Configuration, setup: Setup) {
		if (!config.programs) config.programs = {};

		const msgmergeOptions = setup.msgmergeOptions
			.split(/ +/)
			.map(option => option.replace(/^-+/, ''));
		const msgfmtOptions = setup.msgfmtOptions
			.split(/ +/)
			.map(option => option.replace(/^-+/, ''));

		if (setup.msgmerge !== 'msgmerge') {
			config.programs.msgmerge ??= {};
			config.programs.msgmerge.path = setup.msgmerge;
		} else if (this.options.verbose) {
			console.log(
				gtx._x(
					"The tool '{tool}' is in your $PATH. No need to" +
						' save it in the configuration.',
					{ tool: 'msgmerge' },
				),
			);
		}

		if (msgmergeOptions.length > 0) {
			config.programs.msgmerge ??= {};
			config.programs.msgmerge.options = msgmergeOptions;
		}

		if (setup.msgfmt !== 'msgfmt') {
			config.programs.msgfmt ??= {};
			config.programs.msgfmt.path = setup.msgfmt;
		} else if (this.options.verbose) {
			console.log(
				gtx._x(
					"The tool '{tool}' is in your $PATH. No need to" +
						' save it in the configuration.',
					{ tool: 'msgfmt' },
				),
			);
		}

		if (msgfmtOptions.length > 0) {
			config.programs.msgfmt ??= {};
			config.programs.msgfmt.options = msgfmtOptions;
		}
	}

	private getConfiguration(setup: Setup): Configuration {
		const pkg = this.packageJson;
		const verbose = this.options.verbose;

		if (verbose) {
			console.log(gtx._('Setting configuration values.'));
		}

		// We could actually initialize this in a smarter manner by setting
		// all properties to empty objects.  But that does not compile because
		// all of them are optiona.
		const config: Configuration = {};

		if (!config.package) config.package = {};

		if (typeof pkg.name === 'undefined') {
			config.package.name = setup.textdomain;
		} else {
			config.package.name = pkg.name;
		}
		config.package.version = pkg.version;
		config.package.textdomain = setup.textdomain;

		let msgidBugsAddressFile = gtx._('Your input');
		if (
			typeof this.configuration.package?.['msgid-bugs-address'] !== 'undefined'
		) {
			config.package['msgid-bugs-address'] =
				this.configuration.package['msgid-bugs-address'];
			msgidBugsAddressFile = 'package.json: bugs';
		}

		let copyrightHolderFile = gtx._('Your input');
		if (
			typeof this.configuration.package?.['copyright-holder'] !== 'undefined'
		) {
			config.package['copyright-holder'] =
				this.configuration.package['copyright-holder'];
			copyrightHolderFile = 'package.json: people.author';
		}

		if (!config.po) config.po = {};
		config.po.directory = setup.poDirectory;
		config.po.locales = [];

		if (!config.install) config.install = {};
		config.install.directory = setup.localeDirectory;

		this.setPrograms(config, setup);

		if (this.options.verbose) {
			console.log(gtx._('Validating the configuration.'));
		}
		if (
			!ConfigurationFactory.validate(
				config,
				{
					jsConfigFile: gtx._('your input'),
					msgidBugsAddressFile: msgidBugsAddressFile,
					copyrightHolderFile: copyrightHolderFile,
					versionFile: 'package.json',
					nameFile: 'package.json',
				},
				Textdomain.locale,
			)
		) {
			this.error(
				gtx._(
					'Please try again with option --verbose to see the origin of the above errors.',
				),
			);
			process.exit(1);
		}

		return config;
	}

	private getJsonConfig(config: Configuration, indent: string): string {
		return JSON.stringify(config, null, indent);
	}

	private getJsConfig(config: Configuration, setup: Setup, indent: string) {
		const header =
			setup.configFile === 'esgettext.config.mjs'
				? 'export default '
				: 'module.exports = ';
		const comment = gtx._x(
			'Configuration for esgettext, created by {package} {version}.',
			{
				package: Package.getName(),
				version: 'v' + Package.getVersion(),
			},
		);
		const body = util.inspect(config, {
			depth: null,
			maxArrayLength: null,
			maxStringLength: null,
		});
		const bodyLines = body.split('\n');
		const match = bodyLines[1].match(/^(\t| *)/);
		const bodyIndent = match?.groups?.[1];
		const indentedBody = body;
		const code = `// ${comment}\n${header} ${indentedBody}`;

		return code.replace(new RegExp(`^${bodyIndent}`, 'gm'), indent);
	}

	private createPODirectory(setup: Setup) {
		if (!fs.existsSync(setup.poDirectory)) {
			console.log(gtx._x("Creating PO directory '{directory}'."));
			if (!this.options.dryRun) {
				mkdirp.sync(setup.poDirectory);
			}
		} else if (this.options.verbose) {
			console.log(gtx._x("PO directory '{directory}' already exists."));
		}
	}

	private async writeFiles(config: Configuration, setup: Setup) {
		this.createPODirectory(setup);
		const pkg = await NPMCliPackageJson.load(process.cwd());
		const content = pkg.content as PackageJson;

		const newline = content[
			Symbol.for('newline') as unknown as keyof typeof content
		] as string;
		const indent = content[
			Symbol.for('indent') as unknown as keyof typeof content
		] as string;

		let serialized: string | undefined;
		if (setup.configFile === 'package.json') {
			content.esgettext = config;
		} else if (setup.configFile === 'esgettext.config.json') {
			serialized = this.getJsonConfig(config, indent);
		} else {
			serialized = this.getJsConfig(config, setup, indent);
		}

		if (this.options.verbose) {
			console.log(
				gtx._x("Writing configuration to '{filename}'.", {
					filename: setup.configFile,
				}),
			);
		}

		if (typeof serialized !== 'undefined' && !this.options.dryRun) {
			const data = serialized.replace('\n', newline);
			fs.writeFileSync(setup.configFile, data);
		}

		if (this.options.verbose) {
			console.log(
				gtx._x(
					"Adding package '{package}' version '{version}' as a dependency.",
					{
						package: '@esgettext/runtime',
						version: `^${Package.getVersion()}`,
					},
				),
			);
		}
		const dependencies = {
			...pkg.content.dependencies,
			'@esgettext/runtime': `^${Package.getVersion()}`,
		};

		if (this.options.verbose) {
			console.log(
				gtx._x(
					"Adding package '{package}' version {version} as a development dependencyy.",
					{ package: '@esgettext/tools', version: `^${Package.getVersion()}` },
				),
			);
		}
		const devDependencies = {
			...pkg.content.devDependencies,
			'@esgettext/tools': `^${Package.getVersion()}`,
		};

		if (
			!pkg.content.devDependencies?.['npm-run-all'] &&
			!pkg.content.dependencies?.['npm-run-all']
		) {
			if (this.options.verbose) {
				console.log(
					gtx._x(
						"Adding package '{package}' version {version} as a development dependencyy.",
						{ package: 'npm-run-all', version: Package.getNpmRunAllVersion() },
					),
				);
			}
			devDependencies[
				'npm-run-all' as unknown as keyof typeof devDependencies
			] = Package.getNpmRunAllVersion();
		}

		const potfilesOptions = this.potfilesOptions(setup).join(' ');

		let directory = setup.poDirectory;
		if (directory.includes(' ') || directory.includes('"')) {
			directory = `"${directory.replace(/([\\""])/g, '\\$1')}"`;
		}

		const scripts = {
			...pkg.content.scripts,
			esgettext:
				'npm-run-all esgettext:potfiles esgettext:extract esgettext:update-po esgettext:update-mo esgettext:install',
			'esgettext:potfiles': `esgettext potfiles ${potfilesOptions} >${setup.poDirectory}/POTFILES`,
			'esgettext:extract': `esgettext extract --directory ${directory} --files-from=${directory}/POTFILES`,
			'esgettext:update-po': `esgettext msgmerge-all`,
			'esgettext:update-mo': `esgettext msgfmt-all`,
			'esgettext:install': `esgettext install`,
			'esgettext:addlang': `esgettext msginit`,
		};

		const peerDependencies =
			(pkg.content.peerDependencies as { [key: string]: string }) ?? undefined;
		const optionalDependencies =
			(pkg.content.optionalDependencies as { [key: string]: string }) ??
			undefined;

		pkg.update({
			scripts,
			dependencies,
			devDependencies,
			peerDependencies,
			optionalDependencies,
		});

		if (this.options.verbose) {
			console.log(
				gtx._x("Writing updated '{filename}'.", { filename: 'package.json' }),
			);
		}
		if (!this.options.dryRun) {
			await pkg.save();
		}
	}

	private installDependencies(setup: Setup) {
		const command = `${setup.packageManager} install`;

		if (this.options.verbose) {
			console.log(gtx._x("Run '{command}'.", { command }));
		}

		if (!this.options.dryRun) {
			child_process.execSync(command, {
				stdio: ['ignore', process.stdout, process.stderr],
				encoding: 'utf-8',
			});
		}
	}

	private nextSteps(setup: Setup) {
		if (this.options.verbose) {
			console.log('');
		}
		console.log(gtx._('The next steps are:'));
		console.log(
			gtx._(
				'1) Mark translatable strings in your code like this "gtx._(\'Hello, world!\')".',
			),
		);
		console.log(
			gtx._x("2) Extract strings with '{command}' into '{filename}'.", {
				command: 'npm run esgettext:update-po',
				filename: `${setup.poDirectory}/${setup.textdomain}.pot`,
			}),
		);
		console.log(
			gtx._x(
				"3) Create a translation file with '{command}' (replace 'xy' with a language code like 'de' or 'pt_BR').",
				{
					command: `msginit -l xy -i ${setup.poDirectory}/${setup.textdomain}.pot -o po/xy.po`,
				},
			),
		);
		console.log(
			gtx._x('4) Translate the message with a PO editor of your choice.', {
				command: `msginit -l xy -i ${setup.poDirectory}/${setup.textdomain}.pot -o po/xy.po`,
			}),
		);
		console.log(
			gtx._x("5) Install the translation with '{command}'.", {
				command: 'npm run esgettext:install',
			}),
		);
		console.log();
		console.log(
			gtx._x(
				"The command '{command}' executes all steps of the translation workflow at once.",
				{ command: 'npm run esgettext' },
			),
		);
	}

	private getGitFiles(): Array<string> | null {
		try {
			return child_process
				.execSync('git ls-files', {
					stdio: 'pipe',
					encoding: 'utf-8',
				})
				.split(/[\r\n]+/);
		} catch (_) {
			return null;
		}
	}

	private potfilesOptions(setup: Setup): Array<string> {
		const hasNodeModules = fs.existsSync('node_modules');
		let exclude: Array<string> = [];

		if (hasNodeModules) {
			exclude.push('node_modules');
		}

		if (this.options.verbose) {
			console.log(gtx._('Analyzing source files.'));
		}

		if (
			typeof this.packageJson.main !== 'undefined' &&
			this.packageJson.main.length
		) {
			const dir = path.dirname(this.packageJson.main);

			if (dir != '.') {
				exclude.push(path.dirname(this.packageJson.main));
			}
		}

		if (
			typeof this.packageJson.module !== 'undefined' &&
			this.packageJson.module.length
		) {
			const dir = path.dirname(this.packageJson.module);

			if (dir != '.') {
				exclude.push(path.dirname(this.packageJson.module));
			}
		}

		if (
			typeof this.packageJson.browser !== 'undefined' &&
			this.packageJson.browser.length
		) {
			const dir = path.dirname(this.packageJson.browser);

			if (dir != '.') {
				exclude.push(path.dirname(this.packageJson.browser));
			}
		}

		// sort | uniq for JavaScript.
		exclude = exclude
			.sort()
			.filter((item, index) => {
				return index === 0 || item !== exclude[index - 1];
			})
			.map(name => `${name}/**/*`);

		let candidates = globSync('./**/*.{js,mjs,cjs,jsx,ts,tsx}', {
			ignore: exclude,
		});

		const gitFiles = this.getGitFiles();
		if (gitFiles) {
			if (this.options.verbose) {
				console.log(
					gtx._(
						'This is a git repo.  We will only translate files under version control.',
					),
				);
			}

			candidates = candidates.filter(filename => gitFiles.includes(filename));
		}

		let hasTestDir = false;
		let hasSpec = false;
		for (const candidate of candidates) {
			const parts = candidate.split('/');
			if (!hasTestDir && parts[0].match(/^tests?$/)) {
				if (this.options.verbose) {
					console.log(
						gtx._x(
							'Looks like you have test files under {directory}. We will not translate them.',
						),
					);
				}
				exclude.push(`${parts[0]}/*/**`);
				hasTestDir = true;
			}
			if (!hasSpec && parts[parts.length - 1].match(/\.spec\./)) {
				exclude.push(`**/*.spec.*`);
				hasSpec = true;
			}
		}

		const extenders: { [dir: string]: Array<string> } = {};
		let topLevelDirectories = candidates.map(name => {
			const parts = name.split('/');
			const filename = parts[parts.length - 1];
			const fparts = filename.split('.');

			let tld;
			if (parts.length === 1) {
				tld = '.';
			} else {
				tld = parts[0];
			}

			extenders[tld] ??= [];
			extenders[tld].push(fparts[fparts.length - 1]);

			return tld;
		});

		// And make them unique.
		topLevelDirectories = topLevelDirectories.sort().filter((item, index) => {
			return index === 0 || item !== topLevelDirectories[index - 1];
		});

		const options: Array<string> = [`--directory=${setup.poDirectory}`];

		if (gitFiles) {
			options.push('--git');
		}

		for (const pattern of exclude) {
			options.push(`--exclude="${pattern}"`);
		}

		if (!topLevelDirectories.length) {
			this.error(
				gtx._x(
					"Warning! Could not find any source files.  Will use the pattern './src/**/*.{js,jsx,ts,tsx}.",
				),
			);
			options.push('"./src/**/*.{js,jsx,ts,tsx}"');
		} else {
			for (const tld in extenders) {
				let x = extenders[tld];
				x = x.sort().filter((item, index) => {
					return index === 0 || item !== x[index - 1];
				});

				if (x.length > 1) {
					options.push(`"./${tld}/**/*.{${x.join(',')}}"`);
				} else {
					options.push(`"./${tld}/**/*.${x[0]}"`);
				}
			}
		}

		if (this.options.verbose) {
			console.log(
				gtx._x(
					'Command-line options for extracting source files are: {options}',
					{ options: options.join(' ') },
				),
			);
		}

		return options;
	}

	private checkOverwrite(setup: Setup): boolean {
		if (this.options.force) return true;

		// The po directory are already checked.
		const filename = setup.configFile;
		if (filename !== 'package.json' && fs.existsSync(filename)) {
			this.error(
				gtx._x("Error: The file '{filename}' already exists!", {
					filename,
				}),
			);
			this.error(
				gtx._x("Will not overwrite without option '{option}'.", {
					option: '--force',
				}),
			);
			return false;
		}

		const pkg = this.packageJson;
		if (pkg.scripts) {
			const esgettextScripts = [
				'esgettext',
				'esgettext:potfiles',
				'esgettext:extract',
				'esgettext:update-po',
				'esgettext:update-mo',
				'esgettext:install',
			];

			for (const script of esgettextScripts) {
				if (Object.prototype.hasOwnProperty.call(pkg.scripts, script)) {
					this.error(
						gtx._x(
							"Error: The file '{filename}' already defines a script '{script}'.",
							{ filename: 'package.json' },
						),
					);
					this.error(
						gtx._x("Will not overwrite without option '{option}'.", {
							option: '--force',
						}),
					);

					return false;
				}
			}
		}

		return true;
	}

	private escapePath(name: string): string {
		if (name.includes(' ') || name.includes('"')) {
			return `"${name.replace(/([\\""])/g, '\\$1')}"`;
		} else {
			return name;
		}
	}

	private checkTool(name: string): Promise<boolean | string> {
		return new Promise(resolve => {
			const command = this.escapePath(name) + ' --version';
			try {
				child_process.execSync(command, {
					stdio: ['ignore', 'ignore', 'ignore'],
				});
				return resolve(true);
			} catch (error) {
				return resolve(
					gtx._x('The command {command} did not work.' + ' Error: {error}.', {
						command,
						error,
					}),
				);
			}
		});
	}

	private async doRun(argv: yargs.Arguments): Promise<number> {
		await this.init(argv);

		const setup = await this.promptUser();
		if (!this.checkOverwrite(setup)) {
			return 1;
		}

		const configuration = this.getConfiguration(setup);

		try {
			await this.writeFiles(configuration, setup);
			this.installDependencies(setup);
		} catch (error) {
			this.error(gtx._('Error writing output:'));
			this.error(error);
			return 1;
		}

		this.nextSteps(setup);

		return 0;
	}

	public run(argv: yargs.Arguments): Promise<number> {
		return new Promise(resolve => {
			if (!coerceOptions(argv, this.args())) {
				return resolve(1);
			}

			this.doRun(argv)
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
				resolve(gtx._('Please enter a string with at least one character!'));
			} else {
				resolve(true);
			}
		});
	}

	private checkTextdomain(textdomain: string): Promise<boolean | string> {
		return this.nonEmpty(textdomain)
			.then(notEmpty => {
				if (typeof notEmpty === 'string') {
					return notEmpty;
				}
				if (textdomain.trim().match(/[/\\:]/)) {
					return gtx._x(
						'A valid textdomain must not contain a' +
							" slash ('{slash}'), backslash ('{backslash}', or" +
							" colon ('{colon}').",
						{
							slash: '/',
							backslash: '\\',
							colon: ':',
						},
					);
				} else {
					return true;
				}
			})
			.catch((error: unknown) => {
				return gtx._x('An unknown error occurred: {error}!', { error });
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
						}) +
							' ' +
							gtx._x("Will not overwrite without option '{option}'.", {
								option: '--force',
							}),
					);
				}
			}

			return resolve(true);
		});
	}

	private guessTextdomain(): string | undefined {
		if (this.configuration.package?.name) {
			return this.configuration.package?.name.replace(/^@(.+)\/(.+)/, '$1-$2');
		}
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
			return 'esgettext.config.mjs';
		} else if (this.packageJson.type === 'commonjs') {
			return 'esgettext.config.cjs';
		} else {
			return 'esgettext.config.json';
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
				default: this.guessTextdomain(),
				validate: answer => this.checkTextdomain(answer),
			}),
			msgmerge: await input({
				message: gtx._x("The '{tool}' program to use:", { tool: 'msgmerge' }),
				default: 'msgmerge',
				validate: answer => this.checkTool(answer),
			}),
			msgmergeOptions: await input({
				message: gtx._x("(Boolean) options to invoke '{tool}' with", {
					tool: 'msgmerge',
				}),
				default: '--verbose',
			}),
			msgfmt: await input({
				message: gtx._x("The '{tool}' program to use:", { tool: 'msgfmt' }),
				default: 'msgfmt',
				validate: answer => this.checkTool(answer),
			}),
			msgfmtOptions: await input({
				message: gtx._x("Options to invoke '{tool}' with", { tool: 'msgfmt' }),
				default: '--check --statistics --verbose',
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
				message: gtx._('Where do you want to put configuration'),
				choices: [
					{
						name: 'esgettext.config.mjs',
						value: 'esgettext.config.mjs',
					},
					{
						name: 'esgettext.config.cjs',
						value: 'esgettext.config.cjs',
					},
					{
						name: 'esgettext.config.json',
						value: 'esgettext.config.json',
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

	private error(...args: unknown[]) {
		const redOn = '\x1b[31m';
		const redOff = '\x1b[0m';
		console.error(redOn, ...args, redOff);
	}
}
