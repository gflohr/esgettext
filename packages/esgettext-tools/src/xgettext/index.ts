import { extname, join } from 'path';
import { writeFileSync } from 'fs';
import { Textdomain } from '@esgettext/runtime';
import { Catalog, CatalogProperties } from '../pot/catalog';
import { Options } from '../cli/getopt';
import { JavaScriptParser } from '../parser/javascript';
import { TypeScriptParser } from '../parser/typescript';
import { Parser } from '../parser/parser';
import { FilesCollector } from './files-collector';

/* eslint-disable no-console */

const gtx = Textdomain.getInstance('esgettext-tools');

export class XGettext {
	private readonly catalog: Catalog;

	constructor(private readonly options: Options) {
		const catalogProperties: CatalogProperties = {};

		this.catalog = new Catalog(catalogProperties);

		if (typeof options.language !== 'undefined') {
			options.language = options.language.toLowerCase();
			if (!['javascript', 'typescript'].includes(options.language)) {
				throw new Error(
					gtx._x('language "{language}" unknown', {
						language: this.options.language,
					}),
				);
			}
		}
	}

	/**
	 * Run the extractor.
	 *
	 * @returns the exit code.
	 */
	public run(): number {
		let exitCode = 0;

		const fileCollector = new FilesCollector(
			this.options.filesFrom,
			this.options._,
		);
		fileCollector.filenames.forEach(filename => {
			try {
				if (!this.parseFile(filename)) {
					exitCode = 1;
				}
			} catch (exception) {
				console.error(
					gtx._x('{programName}: {exception}', {
						programName: this.options['$0'],
						exception,
					}),
				);
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

	private parseFile(filename: string): boolean {
		let parser: Parser;

		if (typeof this.options.language !== 'undefined') {
			parser = this.getParserByLanguage(this.options.language);
		} else {
			parser = this.getParserByFilename(filename);
		}

		parser.parseFile(filename);

		return true;
	}

	private getParserByFilename(filename: string): Parser {
		let parser: Parser;
		const ext = extname(filename);

		switch (ext.toLocaleLowerCase()) {
			case '.ts':
			case '.tsx':
				parser = new TypeScriptParser(this.catalog, {});
				break;
			case '.js':
			case '.jsx':
				parser = new JavaScriptParser(this.catalog, {});
				break;
			default:
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
				parser = new JavaScriptParser(this.catalog, {});
				break;
		}

		return parser;
	}

	private getParserByLanguage(language: string): Parser {
		let parser: Parser;
		switch (language.toLocaleLowerCase()) {
			case 'typescript':
				parser = new TypeScriptParser(this.catalog, {});
				break;
			case 'javascript':
			default:
				parser = new JavaScriptParser(this.catalog, {});
				break;
		}

		return parser;
	}

	private warn(msg: string): void {
		console.error(
			gtx._x('{programName}: warning: {msg}', {
				msg,
				programName: process.argv[1],
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
		const path = join(outputDir, filename);
		writeFileSync(path, po);
	}
}
