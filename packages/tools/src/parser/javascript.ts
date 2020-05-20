import { decode } from 'iconv-lite';
import { parse } from '@babel/parser';
import { Textdomain } from '@esgettext/runtime';
import { Parser } from './parser';

const gtx = Textdomain.getInstance('esgettext-tools');

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
			// Documented but not supported. FIXME! Maybe only missing in types.
			// errorRecovery: true,
			sourceFilename: filename,
			plugins: ['flow'],
		});

		this.extract(filename, ast);
		if (this.errors) {
			if (this.errors) {
				throw new Error(
					gtx._n(
						'Fix the above error before proceeding!',
						'Fix the above errors before proceeding!',
						this.errors,
					),
				);
			}
		}
	}
}
