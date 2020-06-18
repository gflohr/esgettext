import * as path from 'path';
import { writeFileSync, readFileSync } from 'fs';
import { Textdomain } from '@esgettext/runtime';
import { Catalog, CatalogProperties } from '../pot/catalog';
import { Options } from '../cli/getopt';
import { JavaScriptParser } from '../parser/javascript';
import { TypeScriptParser } from '../parser/typescript';
import { Parser, ParserOptions } from '../parser/parser';
import { PoParser } from '../parser/po';
import { FilesCollector } from './files-collector';

/* eslint-disable no-console */

const gtx = Textdomain.getInstance('esgettext-tools');

export class XGettext {
	private readonly catalog: Catalog;

	/* The date is passed only for testing. */
	constructor(private readonly options: Options, date?: string) {
		const catalogProperties: CatalogProperties = { date };

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

			/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
			const parserOptions = (({ fromCode }) => ({ fromCode }))(this.options);
			const parser = new PoParser(this.catalog, parserOptions);
			let filename: string = this.options.output;
			try {
				if (!parser.parse(this.readFile(filename), filename)) {
					exitCode = 1;
				}
			} catch (msg) {
				if ('-' === filename) {
					filename = gtx._('[standard input]');
				}
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
		/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
		const parserOptions = (({ fromCode }) => ({ fromCode }))(this.options);

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
		if (!this.options.forcePo) {
			if (this.catalog.entries.length < 2) {
				return;
			}
		}

		const po = this.catalog.toString();

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
}
