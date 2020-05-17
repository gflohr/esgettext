import { decode } from 'iconv-lite';
import { Catalog } from '../pot/catalog';
import { Parser } from './parser';
import { parse } from '@babel/parser';

export class JavaScriptParser extends Parser {
	private catalog: Catalog;
	constructor(private readonly warner: (msg: string) => void) {
		super();
	}

	parse(buf: Buffer, filename: string, encoding?: string): Catalog {
		// Reset.
		this.catalog = new Catalog({ fromCode: encoding, noHeader: true });

		const input =
			typeof encoding === 'undefined' ? buf.toString() : decode(buf, encoding);

		const ast = parse(input, {
			allowAwaitOutsideFunction: true,
			allowImportExportEverywhere: true,
			allowReturnOutsideFunction: true,
			allowSuperOutsideMethod: true,
			allowUndeclaredExports: true,
			// Documented but not supported.
			// errorRecovery: true,
			sourceFilename: filename,
			ranges: true,
			plugins: ['typescript'],
		});

		return this.catalog;
	}
}
