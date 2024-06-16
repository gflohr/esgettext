import * as fs from 'fs';
import yargs from 'yargs';
import { Command } from '../command';
import { Textdomain } from '@esgettext/runtime';
import { Configuration } from '../configuration';
import { Package } from '../package';

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');

type CatalogFormat = 'mo.json' | 'mo' | 'json';

type ConvertOptions = {
	_: string[];
	input: string;
	output: string;
	inputFormat: CatalogFormat;
	outputFormat: CatalogFormat;
	verbose?: boolean;
	[key: string]: string | string[] | boolean | undefined;
};

export class Convert implements Command {
	private options: ConvertOptions;
	private readonly configuration: Configuration;

	constructor(configuration: Configuration) {
		this.configuration = configuration;
	}

	synopsis(): string {
		return `[${gtx._('INPUTFILE')}] [${gtx._('OUTPUTFILE')}]`;
	}

	description(): string {
		return gtx._('Convert translation catalogs.');
	}

	aliases(): Array<string> {
		return [];
	}

	args(): { [key: string]: yargs.Options } {
		return {
			input: {
				alias: 'i',
				type: 'string',
				describe: gtx._('Input file (stdin when omitted)'),
				group: gtx._('File locations:'),
			},
			output: {
				alias: 'o',
				type: 'string',
				describe: gtx._('Output file (stdout when omitted)'),
				group: gtx._('File locations:'),
			},
			'input-format': {
				alias: 'I',
				type: 'string',
				describe: gtx._('Input file format (defaul: derived from filename)'),
				choices: ['mo.json', 'mo', 'json'],
				coerce: arg => arg.toLowerCase(),
				group: gtx._('File formats:'),
			},
			'output-format': {
				alias: 'O',
				type: 'string',
				describe: gtx._('Output file format (default: derived from format)'),
				choices: ['mo.json', 'json'],
				coerce: arg => arg.toLowerCase(),
				group: gtx._('File formats:'),
			},
			verbose: {
				alias: 'V',
				type: 'boolean',
				describe: gtx._('Enable verbose output'),
			},
		};
	}

	additional(argv: yargs.Argv) {
		console.log('doing positional ...');
		argv.positional(gtx._('INPUTFILE'), {
			type: 'string',
			describe: gtx._('Input file (or option -i or standard input)'),
		});
		argv.positional(gtx._('OUTPUTFILE'), {
			type: 'string',
			describe: gtx._('Output file (or option -o or standard output)'),
		});
		argv.conflicts('input', 'INPUTFILE');
		argv.conflicts('output', 'OUTPUTFILE');
	}

	private init(argv: yargs.Arguments) {
		const options = argv as unknown as ConvertOptions;
		this.options = options;
		console.log(this.options);
	}

	public run(argv: yargs.Arguments): Promise<number> {
		this.init(argv);

		const options = this.options;

		return new Promise(resolve => {
			const input = options.input || (options[gtx._('INPUTFILE')] as string);
			const output = options.output || (options[gtx._('INPUTFILE')] as string);

			const inputFormat = this.getFileFormat(input);
			if (!this.checkInputFormat(inputFormat, input)) {
				return resolve(1);
			}
			const outputFormat = this.getFileFormat(output);
			if (!this.checkOutputFormat(outputFormat, output)) {
				return resolve(1);
			}

			return resolve(0);
		});
	}

	private getFileFormat(input: string | undefined): CatalogFormat | undefined {
		if (this.options.inputFormat) {
			return this.options.inputFormat;
		} else if (typeof input !== 'undefined') {
			const match = input.match(/\.(mo\.json|mo|json)$/i);

			if (match) {
				return match[1].toLowerCase() as CatalogFormat;
			}
		}

		return;
	}

	private checkInputFormat(
		format: CatalogFormat | undefined,
		filename: string | undefined,
	): boolean {
		if (!format) {
			if (typeof filename === 'undefined') {
				console.error(
					gtx._x(
						"{programName}: Error: The option '--inputFormat' is mandatory, when reading from standard input",
						{ programName: Package.getName() },
					),
				);
			} else {
				console.error(
					gtx._x(
						"{programName}: Error: Please specify the input format with '--inputFormat'! Cannot guess it from input filename '{filename}'!",
						{ programName: Package.getName(), filename: input },
					),
				);
			}

			return false;
		} else if (format !== 'mo.json' && format !== 'mo' && format !== 'json') {
			console.error(
				gtx._("only 'mo.json', 'mo', and 'json' are allowed as input formats!"),
			);

			return false;
		}

		return true;
	}

	private checkOutputFormat(
		format: CatalogFormat | undefined,
		filename: string | undefined,
	): boolean {
		if (!format) {
			if (typeof filename === 'undefined') {
				console.error(
					gtx._x(
						"{programName}: Error: The option '--outputFormat' is mandatory, when writing to standard input",
						{ programName: Package.getName() },
					),
				);
			} else {
				console.error(
					gtx._x(
						"{programName}: Error: Please specify the output format with '--outputFormat'! Cannot guess it from input filename '{filename}'!",
						{ programName: Package.getName(), filename: input },
					),
				);
			}

			return false;
		} else if (format !== 'mo.json' && format !== 'mo' && format !== 'json') {
			console.error(
				gtx._("only 'mo.json', 'mo', and 'json' are allowed as input formats!"),
			);

			return false;
		}

		return true;
	}

	private readInput(filename: string | undefined): string {
		if (filename === '-' && !fs.existsSync(filename)) {
			filename = undefined;
		}

		if (typeof filename !== 'undefined') {
			try {
				return fs.readFileSync()
			}
		}
	}
}
