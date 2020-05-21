import { decode } from 'iconv-lite';
import { parse } from '@babel/parser';
import { Parser } from './parser';

export class JavaScriptParser extends Parser {
	parse(buf: Buffer, filename: string, encoding?: string): boolean {
		const input =
			typeof encoding === 'undefined' ? buf.toString() : decode(buf, encoding);

		const ast = parse(input, {
			allowAwaitOutsideFunction: true,
			allowImportExportEverywhere: true,
			allowReturnOutsideFunction: true,
			allowSuperOutsideMethod: true,
			allowUndeclaredExports: true,
			// Documented but not supported. FIXME! Maybe only missing in types.
			// errorRecovery: true,
			sourceFilename: filename,
			plugins: ['flow'],
		});

		return this.extract(filename, ast);
	}
}
