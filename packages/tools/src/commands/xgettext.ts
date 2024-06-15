import { copyFile, existsSync, readFileSync, writeFile } from 'fs';
import { Command } from '../command';
import { Textdomain, parseMoCatalog } from '@esgettext/runtime';
import yargs from 'yargs';
import * as mkdirp from 'mkdirp';
import { Configuration } from '../configuration';

interface ExclusionCatalog {
	[key: string]: Array<string>;
}

interface XGettextOptions {
	packageJson: string;
	directory: string[];
	output: string;
	packageName: string;
	packageVersion: string;
	msgidBugsAddress: string;
	version: string;
	language: string;
	excludeFile: string[];
	joinExisting: boolean;
	$0: string;
	_: string[];
	filesFrom: string[];
	width: number;
	forcePo: boolean;
	defaultDomain: string;
	outputDir: string;
	fromCode: string;
	addComments: string[];
	addAllComments: boolean;
	extractAll: boolean;
	keyword: string[];
}

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');

export class XGettext implements Command {
	private locales: Array<string>;
	private options: XGettextOptions;
	private readonly configuration: Configuration;

	constructor(configuration: Configuration) {
		this.configuration = configuration;
	}

	synopsis(): string {
		return gtx._('[OPTIONS] [INPUTFILE]...');
	}

	description(): string {
		return gtx._('Extract translatable strings from given input files.');
	}

	aliases(): Array<string> {
		return ['extract'];
	}

	args(): { [key: string]: yargs.Options } {
		const outputFile = this.configuration.package?.textdomain
			? `${this.configuration.package.textdomain}.pot`
			: undefined;

		return {
			'files-from': {
				group: gtx._('Input file location:'),
				type: 'string',
				array: true,
				describe: gtx._('get list of input files from FILE'),
			},
			directory: {
				group: gtx._('Input file location:'),
				type: 'string',
				array: true,
				describe: gtx._(
					'add directory to list for input files search\nIf input file is -, standard input is read.',
				),
			},
			'default-domain': {
				group: gtx._('Output file location:'),
				alias: 'd',
				type: 'string',
				describe: gtx._(
					'use NAME.po for output (instead of messages.po)',
				),
			},
			output: {
				group: gtx._('Output file location:'),
				alias: 'o',
				type: 'string',
				describe: gtx._('write output to specified file'),
				default: outputFile,
			},
			'output-dir': {
				group: gtx._('Output file location:'),
				alias: 'p',
				type: 'string',
				describe: gtx._(
					'output files will be placed in directory DIR. If output file is -, output is written to standard output.',
				),
				default: this.configuration.po?.directory ?? '.',
			},
			language: {
				group: gtx._('Choice of input file language:'),
				alias: 'L',
				type: 'string',
				describe: gtx._(
					'recognise the specified language (JavaScript, TypeScript, HTML). Default is to auto-detect language based on filename extension.',
				),
			},
			'from-code': {
				group: gtx._('Interpretation of input files:'),
				type: 'string',
				describe: gtx._('encoding of input files'),
				default: 'ASCII',
			},
			'join-existing': {
				group: gtx._('Operation mode:'),
				alias: 'j',
				type: 'boolean',
				describe: gtx._('join messages with existing file'),
			},
			'exclude-file': {
				group: gtx._('Operation mode:'),
				alias: 'x',
				type: 'string',
				describe: gtx._('entries from FILE.po are not extracted'),
				array: true,
			},
			'add-comments': {
				group: gtx._('Operation mode:'),
				alias: 'c',
				type: 'string',
				describe: gtx._(
					'place comment blocks starting with TAG and preceding keyword lines in output file',
				),
				array: true,
			},
			'add-all-comments': {
				group: gtx._('Operation mode:'),
				describe: gtx._(
					'place all comment blocks preceding keyword lines in output file',
				),
				type: 'boolean',
			},
			'extract-all': {
				group: gtx._('Language specific options:'),
				alias: 'a',
				type: 'boolean',
				describe: gtx._('extract all strings'),
			},
			'keyword': {
				group: gtx._('Language specific options:'),
				type: 'string',
				describe: gtx._('look for WORD as an additional keyword'),
				array: true,
			},
			'flag': {
				group: gtx._('Language specific options:'),
				type: 'string',
				describe: gtx._(
					'argument: WORD:ARG:FLAG, additional flag for strings inside the argument number ARG of keyword WORD',
				),
				array: true,
			},
			'instance': {
				group: gtx._('Language specific options:'),
				type: 'string',
				describe: gtx._(
					'only accept method calls of specified instance names',
				),
				array: true,
			},
			'force-po': {
				group: gtx._('Output details:'),
				type: 'boolean',
				describe: gtx._('write PO file even if empty'),
			},
			width: {
				group: gtx._('Output details:'),
				type: 'number',
				describe: gtx._('set output page width'),
			},
			'no-wrap': {
				group: gtx._('Output details:'),
				type: 'boolean',
				describe: gtx._(
					'do not break long message lines,' +
						' longer than' +
						' the output page width, into' +
						' several lines',
				),
			},
			'sort-output': {
				group: gtx._('Output details:'),
				alias: 's',
				type: 'boolean',
				describe: gtx._('generate sorted output'),
			},
			'sort-by-file': {
				group: gtx._('Output details:'),
				alias: 'F',
				type: 'boolean',
				describe: gtx._('sort output by file location'),
			},
			'omit-header': {
				group: gtx._('Output details:'),
				type: 'boolean',
				describe: gtx._("don't write header with msgid '\"\"' entry"),
			},
			'copyright-holder': {
				group: gtx._('Output details:'),
				type: 'string',
				describe: gtx._('set copyright holder in output'),
				default: this.configuration.package?.['copyright-holder'],
			},
			'foreign-user': {
				group: gtx._('Output details:'),
				type: 'string',
				describe: gtx._('omit FSF copyright in output for foreign user'),
			},
			'package-name': {
				group: gtx._('Output details:'),
				type: 'string',
				describe: gtx._('set package name in output'),
				default: this.configuration.package?.name,
			},
			'package-version': {
				group: gtx._('Output details:'),
				type: 'string',
				describe: gtx._('set package version in output'),
				default: this.configuration.package?.version,
			},
			'msgid-bugs-address': {
				group: gtx._('Output details:'),
				type: 'string',
				describe: gtx._('set report address for msgid bugs'),
				default: this.configuration.package?.['msgid-bugs-address'],
			},
			'msgstr-prefix': {
				group: gtx._('Output details:'),
				alias: 'm',
				type: 'string',
				describe: gtx._('use STRING or "" as prefix for msgstr values'),
			},
			'msgstr-suffix': {
				group: gtx._('Output details:'),
				alias: 'M',
				type: 'string',
				describe: gtx._('use STRING or "" as suffix for msgstr values'),
			},
			verbose: {
				alias: 'V',
				type: 'boolean',
				describe: gtx._('Enable verbose output'),
			},
		};
	}

	private init(argv: yargs.Arguments) {
		const options = argv as unknown as XGettextOptions;
		this.options = options;
		const conf = this.configuration;

	}

	public run(argv: yargs.Arguments): Promise<number> {
		this.init(argv);

		return new Promise(resolve => {
			resolve(0);
		});
	}
}
