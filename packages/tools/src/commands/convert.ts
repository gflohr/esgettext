import * as fs from 'fs';
import yargs from 'yargs';
import { Command } from '../command';
import {
	Catalog,
	Textdomain,
	parseMoCatalog,
	parseMoJsonCatalog,
} from '@esgettext/runtime';
import { Configuration } from '../configuration';
import { Package } from '../package';

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');

type CatalogFormat = 'mo.json' | 'mo' | 'gmo' | 'json';

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
				choices: ['mo.json', 'mo', 'gmo', 'json'],
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
	}

	public run(argv: yargs.Arguments): Promise<number> {
		this.init(argv);

		const options = this.options;

		return new Promise(resolve => {
			const input = options.input || (options[gtx._('INPUTFILE')] as string);
			const output = options.output || (options[gtx._('OUTPUTFILE')] as string);

			const inputFormat = this.getFileFormat(input);
			if (!this.checkInputFormat(inputFormat, input)) {
				return resolve(1);
			}
			if (options.verbose) {
				console.error(
					gtx._x('Detected input format {inputFormat}.', { inputFormat }),
				);
			}

			const outputFormat = this.getFileFormat(output);
			if (!this.checkOutputFormat(outputFormat, output)) {
				return resolve(1);
			}
			if (options.verbose) {
				console.error(
					gtx._x('Detected output format {outputFormat}.', { outputFormat }),
				);
			}

			try {
				const inBuffer = this.readInput(input);
				let catalog: Catalog;
				switch (options.inputFormat) {
					case 'mo.json':
						catalog = parseMoJsonCatalog(inBuffer);
						break;
					case 'mo':
					case 'gmo':
					default:
						catalog = parseMoCatalog(inBuffer);
						break;
				}

				const converted = this.convert(catalog, input, outputFormat);
				if (!converted) {
					return resolve(1);
				}

				this.output(output, converted);
			} catch (e) {
				console.error(gtx._x('{programName}: Error: {e}'));
				return resolve(1);
			}

			return resolve(0);
		});
	}

	private getFileFormat(input: string | undefined): CatalogFormat | undefined {
		if (this.options.inputFormat) {
			return this.options.inputFormat;
		} else if (typeof input !== 'undefined') {
			const match = input.match(/\.(mo\.json|g?mo|json)$/i);

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
						{ programName: Package.getName(), filename },
					),
				);
			}

			return false;
		} else if (
			format !== 'mo.json' &&
			format !== 'mo' &&
			format !== 'gmo' &&
			format !== 'json'
		) {
			console.error(
				gtx._(
					"Only 'mo.json', 'mo', 'gmo', and 'json' are allowed as input formats!",
				),
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
						{ programName: Package.getName(), filename },
					),
				);
			}

			return false;
		} else if (format !== 'mo.json' && format !== 'json') {
			console.error(
				gtx._("Only 'mo.json' and 'json' are allowed as output formats!"),
			);

			return false;
		}

		return true;
	}

	private readInput(filename: string | undefined): Buffer {
		try {
			if (filename === '-' && !fs.existsSync(filename)) {
				filename = undefined;
			}

			if (typeof filename !== 'undefined') {
				return fs.readFileSync(filename);
			}

			// Must read from standard input.
			const stdinFd = 0;
			const chunks: Buffer[] = [];

			let bytesRead: number;
			const buffer = Buffer.alloc(8192);

			while (
				(bytesRead = fs.readSync(stdinFd, buffer, 0, buffer.length, null)) > 0
			) {
				chunks.push(Buffer.from(buffer.subarray(0, bytesRead)));
			}

			return Buffer.concat(chunks);
		} catch (error) {
			if (typeof filename === 'undefined') {
				filename = gtx._('[standard input]');
			}

			throw Error(
				gtx._x('{filename}: read failed: {error}', { filename, error }),
			);
		}
	}

	private convert(
		catalog: Catalog,
		filename: string | undefined,
		outputFormat: CatalogFormat,
	): string | undefined {
		if (typeof filename === 'undefined') {
			filename = gtx._('[standard input]');
		}

		if (outputFormat === 'json') {
			const entries: { [key: string]: string } = {};
			let errors = 0;
			for (const [msgid, msgstr] of Object.entries(catalog.entries)) {
				if (msgstr.length > 1) {
					++errors;

					console.error(
						gtx._x(
							"{filename}: Error: msgid '{msgid}': plural forms are not supported by the 'json' catalog format!",
							{ filename, msgid: this.shortenAndEscapeString(msgid, 40) },
						),
					);
				} else {
					entries[msgid] = msgstr[0];
				}
			}

			if (errors) {
				return undefined;
			}

			return JSON.stringify(entries);
		} else {
			return JSON.stringify(catalog);
		}
	}

	private shortenAndEscapeString(input: string, maxLength: number): string {
		const controlCharMap: { [key: string]: string } = {
			'\0': '\\0', // Null character
			'\b': '\\b', // Backspace
			'\t': '\\t', // Horizontal Tab
			'\n': '\\n', // New Line
			'\v': '\\v', // Vertical Tab
			'\f': '\\f', // Form Feed
			'\r': '\\r', // Carriage Return
			'"': '\\"', // Double quote
			"'": "\\'", // Single quote
			'\\': '\\\\', // Backslash
		};

		const escapeControlChar = (char: string) => {
			if (controlCharMap[char]) {
				return controlCharMap[char];
			}
			const code = char.charCodeAt(0);
			if (code < 32) {
				return `\\x${code.toString(16).padStart(2, '0')}`;
			}

			return char; // This line is technically redundant with the current regex.
		};

		// Escape all control characters
		const escapedInput = input.replace(/[\x00-\x1F"'\\]/g, escapeControlChar);

		let truncatedString = escapedInput;

		if (escapedInput.length > maxLength) {
			truncatedString = escapedInput.slice(0, maxLength - 3) + '...';
		}

		return truncatedString;
	}

	private output(filename: string | undefined, data: string) {
		if (typeof filename === 'undefined') {
			console.log(data);
		} else {
			try {
				fs.writeFileSync(filename, data, { encoding: 'utf-8' });
			} catch (error) {
				throw Error(
					gtx._x('{filename}: write failed: {error}', { filename, error }),
				);
			}
		}
	}
}
