import yargs from 'yargs';

/* eslint-disable-next-line import/default */
import camelCase from 'camelcase';
import { Textdomain } from '@esgettext/runtime';
import { Package } from '../package';

const gtx = Textdomain.getInstance('tools');

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

export interface GetoptOptions {
	hasVerboseOption?: boolean;
}

export class Getopt {
	readonly programName: string;
	private cli = yargs;
	private readonly allowedKeys = new Map<string, OptionFlags>();
	private readonly defaultFlags: OptionFlags = {};
	private readonly hasVerboseOption: boolean;

	/**
	 * Create a yargs option parser.
	 *
	 * @param usage - string to print for usage
	 * @param description - short one-line description of the program
	 * @param optionGroups - all options grouped
	 * @param options - other options
	 *
	 * The strings should not end in a newline!
	 */
	constructor(
		usage: string,
		description: string,
		optionGroups: OptionGroup[],
		options?: GetoptOptions,
	) {
		this.programName = process.argv[1].split(/[\\/]/).pop();
		this.buildUsage(usage, description);

		if (!options) {
			options = {};
		}

		// eslint-disable-next-line @typescript-eslint/unbound-method
		this.hasVerboseOption = options.hasVerboseOption || false;

		this.allowedKeys.set('help', this.defaultFlags);
		this.allowedKeys.set('h', this.defaultFlags);
		this.allowedKeys.set('version', this.defaultFlags);
		this.allowedKeys.set('V', this.defaultFlags);
		this.allowedKeys.set('_', this.defaultFlags);
		this.allowedKeys.set('$0', this.defaultFlags);

		if (this.hasVerboseOption) {
			this.allowedKeys.set('verbose', this.defaultFlags);
			this.allowedKeys.set('v', this.defaultFlags);
		}

		for (let i = 0; i < optionGroups.length; ++i) {
			const group = optionGroups[i];
			const options = group.options;
			const optionKeys = options.map(option => option.name);

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
					alias.map(a => this.allowedKeys.set(a, flags));
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

		if (keys.includes('help')) {
			this.cli.showHelp('log');
		}

		// TODO! Check for invalid usage!
		for (let i = 0; i < keys.length; ++i) {
			const key = keys[i];
			if (key === '_') {
				continue;
			}
			if (!this.allowedKeys.has(key)) {
				if (key.length > 1) {
					throw new Error(
						gtx._x("'{programName}': unrecognized option '--{option}'", {
							programName: this.programName,
							option: key,
						}),
					);
				} else {
					throw new Error(
						gtx._x("'{programName}': invalid option -- '{option}'", {
							programName: this.programName,
							option: key,
						}),
					);
				}
			}
			const flags = this.allowedKeys.get(key);
			const value = args[key];
			if (Array.isArray(value)) {
				if (value.length > 1 && !flags.multiple) {
					throw new Error(
						gtx._x("The option '{option}' can be given only once.", {
							option: key,
						}),
					);
				}
			} else if (flags.multiple) {
				args[key] = [value];
			}
		}

		return args;
	}

	private buildUsage(usage: string, description: string): void {
		this.cli = this.cli.usage(
			gtx._x('Usage: {programName}', { programName: this.programName }) +
				' ' +
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
					'Arguments to options are referred to in CAPS in the description.',
				),
		);
	}

	private addDefaultOptions(): void {
		const infoOptions = this.hasVerboseOption
			? ['version', 'help', 'verbose']
			: ['version', 'help'];
		const version = Package.getVersion();
		const packageName = Package.getName();
		const versionString =
			`${this.programName} (${packageName}) ${version}\n` +
			gtx._('LICENSE: WTFPL <http://www.wtfpl.net/about/>\n') +
			gtx._('This is free software. You can do with it whatever you want.\n') +
			gtx._('There is NO WARRANTY, to the extent permitted by law.\n') +
			gtx._('Written by Guido Flohr.');

		this.cli = this.cli.group(infoOptions, gtx._('Informative output'));
		this.cli = this.cli
			.option('help', {
				alias: 'h',
				description: gtx._('display this help and exit'),
			})
			.option('version', {
				alias: 'v',
				description: gtx._('output version information and exit'),
			})
			.version(versionString);

		if (this.hasVerboseOption) {
			this.cli = this.cli.options('verbose', {
				alias: 'V',
				description: gtx._('enable verbose output'),
			});
		}

		this.cli = this.cli.epilogue(
			gtx._('Report bugs at https://github.com/gflohr/esgettext/issues'),
		);
	}
}
