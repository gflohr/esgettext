import * as yargs from 'yargs';
import { Gtx } from '../gtx-i18n-runtime';
import * as camelCase from 'camelcase';

const gtx = new Gtx('gtx-i18n-tools');

export interface OptionFlags {
	multiple?: boolean,
}

export interface Option {
	name: string,
	flags?: OptionFlags,
	yargsOptions: yargs.Options,
}

export interface OptionGroup {
	description: string,
	options: Array<Option>,
}

export class Getopt {
	progName: string;
	cli: yargs.Argv<{}>;
	allowedKeys = new Map<string, OptionFlags>();
	defaultFlags: OptionFlags = {};

	/**
	 * Create a yargs option parser.
	 *
	 * @param usage string to print for usage
	 * @param description short one-line description of the program
	 * @param optionGroups all options grouped
	 *
	 * The strings should not end in a newline!
	 */
	constructor(usage: string, description: string,
	            optionGroups: OptionGroup[]) {
		this.progName = process.argv[1].split(/[\\/]/).pop();
		this.cli = yargs;
		this.buildUsage(usage, description);

		this.allowedKeys.set('help', this.defaultFlags);
		this.allowedKeys.set('h', this.defaultFlags);
		this.allowedKeys.set('version', this.defaultFlags);
		this.allowedKeys.set('v', this.defaultFlags);
		this.allowedKeys.set('_', this.defaultFlags);
		this.allowedKeys.set('$0', this.defaultFlags);

		for (let i = 0; i < optionGroups.length; ++i) {
			const group = optionGroups[i];
			const options = group.options;
			const optionKeys = options.map(option => option.name);

			for (let j = 0; j < options.length; ++j) {
				const option = options[j];
				const flags = option.flags || this.defaultFlags;
				this.allowedKeys.set(option.name, flags);
				this.allowedKeys.set(camelCase(option.name), flags);
				let alias = (typeof option.yargsOptions.alias === 'string') ?
					[option.yargsOptions.alias] : option.yargsOptions.alias;
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
	argv() {
		const argv = this.cli.argv;
		const keys = Object.keys(argv);

		// TODO! Check for invalid usage!
		for (let i = 0; i < keys.length; ++i) {
			const key = keys[i];
			if (!this.allowedKeys.has(key)) {
				if (key.length) {
					this.errorExit(gtx._x("'{progName}': unrecognized option '--{option}'",
					               { progName: this.progName, option: key}));
				} else {
					this.errorExit(gtx._x("'{progName}': invalid option -- '{option}'",
					               { progName: this.progName, option: key}));
				}
			}
			const flags = this.allowedKeys.get(key);
			const value = argv[key];
			if (Array.isArray(value) && value.length > 1) {
				if (!flags.multiple) {
					this.errorExit(gtx._x("The option '{option}' can be given only once.",
					               { option: key })));
				}
			}
		}

		return argv;
	}

	private errorExit(message: string) {
		console.error(message);
		console.error(gtx._x("Try '{progName} --help' for more information",
		              { progName: this.progName}));
		process.exit(1);
	}

	private buildUsage(usage: string, description: string) {
		this.cli = this.cli.usage(
			usage + '\n'
			+ '\n'
			+ description + '\n'
			+ '\n'
			+ gtx._('Mandatory arguments to long options are mandatory for short options too.\n')
			+ gtx._('Similarly for optional arguments.\n')
			+ '\n'
			+ gtx._('Argumts to options are refered to in CAPS in the description.')
		);
	}

	private addDefaultOptions() {
		const version = require(__dirname + '/../../package.json').version;
		const packageName = require(__dirname + '/../../package.json').name;
		const versionString = `${this.progName} (${packageName}) ${version}\n`
			+ gtx._('LICENSE: WTFPL <http://www.wtfpl.net/about/>\n')
			+ gtx._('This is free software. You can do with it whatever you want.\n')
			+ gtx._('There is NO WARRANTY, to the extent permitted by law.\n')
			+ gtx._('Written by Guido Flohr.');

		this.cli = this.cli
		.group(['version', 'help'], 'Informative output')
		.version(versionString)
		.alias('version', 'v')
		.help()
		.alias('help', 'h')
		.epilogue(gtx._('Report bugs at https://github.com/gflohr/gtx-i18-tools/issues'));
	}
}
