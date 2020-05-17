import { decode } from 'iconv-lite';
import { parse } from '@babel/parser';
import { Parser } from './parser';

export class JavaScriptParser extends Parser {
	parse(buf: Buffer, filename: string, encoding?: string): void {
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
			plugins: ['typescript'],
		});

		this.extractAllStrings(ast);
	}
}
