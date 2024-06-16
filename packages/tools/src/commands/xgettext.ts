import { writeFileSync, readFileSync } from 'fs';
import yargs from 'yargs';

import { Command } from '../command';
import { Textdomain } from '@esgettext/runtime';
import { Catalog, RenderOptions } from '../pot/catalog';
import { Configuration } from '../configuration';
import { CatalogProperties } from '../pot/catalog';
import { PoParser } from '../parser/po';
import { FilesCollector } from './xgettext/files-collector';
import { Parser, ParserOptions } from '../parser/parser';
import { TypeScriptParser } from '../parser/typescript';
import { JavaScriptParser } from '../parser/javascript';
import { Keyword } from '../pot/keyword';

interface ExclusionCatalog {
	[key: string]: Array<string>;
}

interface XGettextOptions {
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
	private catalog: Catalog;
	private date: string | undefined;
	private exclude: ExclusionCatalog;
	private options: XGettextOptions;
	private readonly configuration: Configuration;

	// The date is only passed for testing.
	constructor(configuration: Configuration, date?: string) {
		this.date = date;
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
				describe: gtx._('use NAME.po for output (instead of messages.po)'),
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
				choices: ['javascript', 'typescript'],
				coerce: arg => arg.toLowerCase(),
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
			keyword: {
				group: gtx._('Language specific options:'),
				type: 'string',
				describe: gtx._('look for WORD as an additional keyword'),
				array: true,
			},
			flag: {
				group: gtx._('Language specific options:'),
				type: 'string',
				describe: gtx._(
					'argument: WORD:ARG:FLAG, additional flag for strings inside the argument number ARG of keyword WORD',
				),
				array: true,
			},
			instance: {
				group: gtx._('Language specific options:'),
				type: 'string',
				describe: gtx._('only accept method calls of specified instance names'),
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
		const catalogProperties: CatalogProperties = { date: this.date };

		catalogProperties.package = conf.package?.name;
		catalogProperties.version = conf.package?.version;
		catalogProperties.msgidBugsAddress = conf.package?.['msgid-bugs-address'];
		catalogProperties.copyrightHolder = conf.package?.['copyright-holder'];

		if (typeof options.output === 'undefined' && conf.package?.textdomain) {
			if (typeof options.outputDir === 'undefined') {
				options.output = conf.package.textdomain + '.pot';
			} else {
				options.output = path.join(
					options.outputDir,
					conf.package.textdomain + '.pot',
				);
			}
		}

		if (typeof options.packageName !== 'undefined') {
			catalogProperties.package = options.packageName;
		}
		if (typeof options.packageVersion !== 'undefined') {
			catalogProperties.version = options.version;
		}
		if (typeof options.msgidBugsAddress !== 'undefined') {
			catalogProperties.msgidBugsAddress = options.msgidBugsAddress;
		}

		this.catalog = new Catalog(catalogProperties);

		if (typeof options.language !== 'undefined') {
			const language = options.language.toLowerCase();
			if (!['javascript', 'typescript'].includes(language)) {
				throw new Error(
					gtx._x('language "{language}" unknown', {
						language: this.options.language,
					}),
				);
			}
			this.options.language = language;
		}
	}

	public doRun(): number {
		let exitCode = 0;

		this.exclude = {} as ExclusionCatalog;
		if (this.options.excludeFile) {
			try {
				if (!this.fillExclusionCatalog(this.options.excludeFile)) {
					return 1;
				}
			} catch (e) {
				const error = e as Error;
				console.error(
					gtx._x('{programName}: error: {message}', {
						programName: this.options.$0,
						message: error.message,
					}),
				);
				return 1;
			}
		}

		if (this.options.joinExisting) {
			if (this.options.output === '-') {
				console.error(
					gtx._x(
						'{programName}: error: --join-existing' +
							' cannot be used, when output is written to stdout',
						{
							programName: this.options.$0,
						},
					),
				);
				return 1;
			}

			const parserOptions = this.getParserOptions();
			const parser = new PoParser(this.catalog, parserOptions);
			const filename: string = this.options.output;
			try {
				if (!parser.parse(this.readFile(filename), filename)) {
					exitCode = 1;
				}
			} catch (msg) {
				console.error(`${filename}: ${msg}`);
				exitCode = 1;
			}
		}

		let fileCollector;
		try {
			fileCollector = new FilesCollector(
				this.options.filesFrom,
				this.options._,
			);
		} catch (e) {
			console.error(`${this.options.$0}: ${e}`);
			return 1;
		}

		// FIXME! The file collector must interpret all filenames relative to
		// the files-from file's director.
		fileCollector.filenames.forEach(filename => {
			try {
				if (!this.parse(this.readFile(filename), filename)) {
					exitCode = 1;
				}
			} catch (msg) {
				if ('-' === filename) {
					filename = gtx._('[standard input]');
				}
				console.error(`${filename}: ${msg}`);
				exitCode = 1;
			}
		});

		if (!exitCode) {
			try {
				this.output();
			} catch (exception) {
				console.error(
					gtx._x('{programName}: {exception}', {
						programName: this.options['$0'],
						exception: exception as string,
					}),
				);
				exitCode = 1;
			}
		}

		return exitCode;
	}

	public run(argv: yargs.Arguments): Promise<number> {
		this.init(argv);

		return new Promise(resolve => {
			try {
				resolve(this.doRun());
			} catch(e) {
				console.error(e);
				resolve(1);
			}
		});
	}

	private parse(code: Buffer, filename: string): boolean {
		let parser: Parser;
		const parserOptions = this.getParserOptions();

		if (typeof this.options.language !== 'undefined') {
			parser = this.getParserByLanguage(this.options.language, parserOptions);
		} else {
			parser = this.getParserByFilename(filename, parserOptions);
		}

		return parser.parse(code, filename);
	}

	private readFile(filename: string): Buffer {
		if ('-' === filename) {
			return process.stdin.read() as Buffer;
		}
		const directories = this.options.directory || [''];

		// Avoid ugly absolute paths.
		const resolve = (dir: string, file: string): string => {
			if (dir === '') {
				return file;
			} else {
				return dir + path.sep + file;
			}
		};

		for (let i = 0; i < directories.length - 1; ++i) {
			try {
				const fullName = resolve(directories[i], filename);
				return readFileSync(fullName);
			} catch (e) {
				/* ignore */
			}
		}

		return readFileSync(resolve(directories[directories.length - 1], filename));
	}

	private getParserByFilename(
		filename: string,
		parserOptions: ParserOptions,
	): Parser {
		let parser: Parser;
		const ext = path.extname(filename);

		switch (ext.toLocaleLowerCase()) {
			case '.ts':
			case '.tsx':
				parser = new TypeScriptParser(this.catalog, parserOptions);
				break;
			case '.js':
			case '.jsx':
				parser = new JavaScriptParser(this.catalog, parserOptions);
				break;
			case '.po':
			case '.pot':
				parser = new PoParser(this.catalog, parserOptions);
				break;
			default:
				if ('-' === filename) {
					this.warn(
						gtx._(
							'language for standard input is unknown without' +
								' option "--language"; will try JavaScript',
						),
					);
				} else {
					this.warn(
						gtx._x(
							'file "{filename}" extension "{extname}"' +
								' is unknown; will try JavaScript instead',
							{
								filename,
								extname: ext,
							},
						),
					);
				}
				parser = new JavaScriptParser(this.catalog, parserOptions);
				break;
		}

		return parser;
	}

	private getParserByLanguage(
		language: string,
		parserOptions: ParserOptions,
	): Parser {
		let parser: Parser;
		switch (language.toLocaleLowerCase()) {
			case 'typescript':
				parser = new TypeScriptParser(this.catalog, parserOptions);
				break;
			case 'javascript':
			default:
				parser = new JavaScriptParser(this.catalog, parserOptions);
				break;
		}

		return parser;
	}

	private warn(msg: string): void {
		console.warn(
			gtx._x('{programName}: warning: {msg}', {
				msg,
				programName: this.options.$0,
			}),
		);
	}

	private output(): void {
		Object.keys(this.exclude)
			.filter(msgctxt =>
				Object.prototype.hasOwnProperty.call(this.exclude, msgctxt),
			)
			.forEach(msgctxt => {
				this.exclude[msgctxt].forEach(msgid => {
					this.catalog.deleteEntry(msgid, msgctxt);
				});
			});

		if (!this.options.forcePo) {
			if (this.catalog.entries.length < 2) {
				return;
			}
		}

		const renderOptions: RenderOptions = {};

		if (typeof this.options.width !== 'undefined') {
			renderOptions.width = this.options.width;
		}

		const po = this.catalog.toString(renderOptions);

		if (this.options.output === '-') {
			process.stdout.write(po);
			return;
		}

		let filename;
		if (typeof this.options.output === 'undefined') {
			const domain =
				typeof this.options.defaultDomain === 'undefined'
					? 'messages'
					: this.options.defaultDomain;
			filename = `${domain}.po`;
		} else {
			filename = this.options.output;
		}

		const outputDir =
			typeof this.options.outputDir === 'undefined'
				? ''
				: this.options.outputDir;

		writeFileSync(path.join(outputDir, filename), po);
	}

	private fillExclusionCatalog(catalogs: Array<string>): boolean {
		const catalog = new Catalog();
		const parser = new PoParser(catalog);
		let success = true;

		catalogs.forEach(filename => {
			if (!parser.parse(this.readFile(filename), filename)) {
				success = false;
			}
		});

		if (!success) {
			return false;
		}

		catalog.deleteEntry('');

		catalog.entries.forEach(entry => {
			if (
				typeof this.exclude[entry.properties.msgctxt as string] === 'undefined'
			) {
				this.exclude[entry.properties.msgctxt as string] = [];
			}
			if (entry.properties.msgid) {
				this.exclude[entry.properties.msgctxt as string].push(
					entry.properties.msgid,
				);
			}
		});

		return true;
	}

	private getParserOptions(): ParserOptions {
		const parserOptions: ParserOptions = (({
			fromCode,
			addComments,
			addAllComments,
			extractAll,
		}): ParserOptions => ({
			fromCode,
			addComments,
			addAllComments,
			extractAll,
		}))(this.options);

		if (this.options.keyword) {
			const cookedKeywords = new Array<Keyword>();
			this.options.keyword.forEach(raw => {
				cookedKeywords.push(Keyword.from(raw));
			});
			parserOptions.keyword = cookedKeywords;
		}

		return parserOptions;
	}
}
