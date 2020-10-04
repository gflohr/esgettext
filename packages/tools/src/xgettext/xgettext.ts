import * as path from 'path';
import { writeFileSync, readFileSync } from 'fs';
import { Textdomain } from '@esgettext/runtime';
import { Catalog, CatalogProperties, RenderOptions } from '../pot/catalog';
import { Options } from '../cli/getopt';
import { JavaScriptParser } from '../parser/javascript';
import { TypeScriptParser } from '../parser/typescript';
import { Parser, ParserOptions } from '../parser/parser';
import { PoParser } from '../parser/po';
import { Keyword } from '../pot/keyword';
import { FilesCollector } from './files-collector';
import { readFileSync as readJsonFileSync } from 'jsonfile';

/* eslint-disable no-console */

const gtx = Textdomain.getInstance('tools');

interface ExclusionCatalog {
	[key: string]: Array<string>;
}

export class XGettext {
	private readonly catalog: Catalog;
	private exclude: ExclusionCatalog;

	/* The date is passed only for testing. */
	constructor(private readonly options: Options, date?: string) {
		const catalogProperties: CatalogProperties = { date };

		if (typeof options.packageJson !== 'undefined') {
			const pkg = readJsonFileSync(options.packageJson);
			catalogProperties.package = pkg.name;
			catalogProperties.version = pkg.version;
			catalogProperties.msgidBugsAddress = pkg['msgid-bugs-address'];
			catalogProperties.copyrightHolder = pkg['author'];
			if (typeof catalogProperties.msgidBugsAddress === 'undefined'
			    && typeof pkg.bugs !== 'undefined') {
				catalogProperties.msgidBugsAddress = pkg.bugs.url;
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

	/**
	 * Run the extractor.
	 *
	 * @returns the exit code.
	 */
	public run(): number {
		let exitCode = 0;

		this.exclude = {} as ExclusionCatalog;
		if (this.options.excludeFile) {
			try {
				if (!this.fillExclusionCatalog(this.options.excludeFile)) {
					return 1;
				}
			} catch (e) {
				console.error(
					gtx._x('{programName}: error: {message}', {
						programName: this.options.$0,
						message: e.message,
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
						exception,
					}),
				);
				exitCode = 1;
			}
		}

		return exitCode;
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
			return process.stdin.read();
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
			if (typeof this.exclude[entry.properties.msgctxt] === 'undefined') {
				this.exclude[entry.properties.msgctxt] = [];
			}
			this.exclude[entry.properties.msgctxt].push(entry.properties.msgid);
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
			this.options.keyword.forEach((raw: string) => {
				cookedKeywords.push(Keyword.from(raw));
			});
			parserOptions.keyword = cookedKeywords;
		}

		return parserOptions;
	}
}
