import yargs from 'yargs';
/* eslint-disable-next-line import/default */
import camelCase from 'camelcase';
import { Textdomain } from 'esgettext-runtime';

const gtx = Textdomain.getInstance('esgettext-tools');

export interface Options {
	/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
	[key: string]: any;
}

export interface OptionFlags {
	multiple?: boolean;
}

export interface Option {
	name: string;
	flags?: OptionFlags;
	yargsOptions: yargs.Options;
}

export interface OptionGroup {
	description: string;
	options: Array<Option>;
}

type ErrorFunction = (message: string) => void;

export interface GetoptOptions {
	errorFunction?: ErrorFunction;
}

export class Getopt {
	private readonly progName: string;
	private cli = yargs;
	private readonly allowedKeys = new Map<string, OptionFlags>();
	private readonly defaultFlags: OptionFlags = {};
	private readonly errorFunction: ErrorFunction;

	/**
	 * Create a yargs option parser.
	 *
	 * @param usage - string to print for usage
	 * @param description - short one-line description of the program
	 * @param optionGroups - all options grouped
	 *
	 * The strings should not end in a newline!
	 */
	constructor(
		usage: string,
		description: string,
		optionGroups: OptionGroup[],
		options?: GetoptOptions,
	) {
		this.progName = process.argv[1].split(/[\\/]/).pop();
		this.buildUsage(usage, description);

		if (!options) {
			options = {};
		}

		// eslint-disable-next-line @typescript-eslint/unbound-method
		this.errorFunction = options.errorFunction || this.errorExit;

		this.allowedKeys.set('help', this.defaultFlags);
		this.allowedKeys.set('h', this.defaultFlags);
		this.allowedKeys.set('version', this.defaultFlags);
		this.allowedKeys.set('v', this.defaultFlags);
		this.allowedKeys.set('_', this.defaultFlags);
		this.allowedKeys.set('$0', this.defaultFlags);

		for (let i = 0; i < optionGroups.length; ++i) {
			const group = optionGroups[i];
			const options = group.options;
			const optionKeys = options.map((option) => option.name);

			for (let j = 0; j < options.length; ++j) {
				const option = options[j];
				const flags = option.flags || this.defaultFlags;
				this.allowedKeys.set(option.name, flags);
				this.allowedKeys.set(camelCase(option.name), flags);
				const alias =
					typeof option.yargsOptions.alias === 'string'
						? [option.yargsOptions.alias]
						: option.yargsOptions.alias;
				if (alias) {
					alias.map((a) => this.allowedKeys.set(a, flags));
				}
			}

			this.cli = this.cli.group(optionKeys, group.description);
			for (let j = 0; j < options.length; ++j) {
				this.cli = this.cli.option(options[j].name, options[j].yargsOptions);
			}
		}

		this.addDefaultOptions();
	}

	/**
	 * Parse the command-line options.
	 *
	 * @returns a dictionary with all options passed and their values.
	 */
	argv(args?: { [x: string]: unknown; _: string[]; $0: string }): Options {
		if (typeof args === 'undefined') {
			args = this.cli.argv;
		}
		const keys = Object.keys(args);

		// TODO! Check for invalid usage!
		for (let i = 0; i < keys.length; ++i) {
			const key = keys[i];
			if (!this.allowedKeys.has(key)) {
				if (key.length) {
					this.errorFunction(
						gtx._x("'{progName}': unrecognized option '--{option}'", {
							progName: this.progName,
							option: key,
						}),
					);
				} else {
					this.errorFunction(
						gtx._x("'{progName}': invalid option -- '{option}'", {
							progName: this.progName,
							option: key,
						}),
					);
				}
			}
			const flags = this.allowedKeys.get(key);
			const value = args[key];
			if (Array.isArray(value) && value.length > 1) {
				if (!flags.multiple) {
					this.errorFunction(
						gtx._x("The option '{option}' can be given only once.", {
							option: key,
						}),
					);
				}
			}
		}

		return args;
	}

	private errorExit(message: string): void {
		process.stderr.write(message);
		process.stderr.write(
			gtx._x("Try '{progName} --help' for more information", {
				progName: this.progName,
			}),
		);
		process.exit(1);
	}

	private buildUsage(usage: string, description: string): void {
		this.cli = this.cli.usage(
			usage +
				'\n' +
				'\n' +
				description +
				'\n' +
				'\n' +
				gtx._(
					'Mandatory arguments to long options are mandatory for short options too.\n',
				) +
				gtx._('Similarly for optional arguments.\n') +
				'\n' +
				gtx._(
					'Arguments to options are refered to in CAPS in the description.',
				),
		);
	}

	private addDefaultOptions(): void {
		const version = require(__dirname + '/../../../../package.json').version;
		const packageName = require(__dirname + '/../../../../package.json').name;
		const versionString =
			`${this.progName} (${packageName}) ${version}\n` +
			gtx._('LICENSE: WTFPL <http://www.wtfpl.net/about/>\n') +
			gtx._('This is free software. You can do with it whatever you want.\n') +
			gtx._('There is NO WARRANTY, to the extent permitted by law.\n') +
			gtx._('Written by Guido Flohr.');

		this.cli = this.cli
			.group(['version', 'help'], 'Informative output')
			.version(versionString)
			.alias('version', 'v')
			.help()
			.alias('help', 'h')
			.epilogue(
				gtx._('Report bugs at https://github.com/gflohr/gtx-i18-tools/issues'),
			);
	}
}
