import { parse } from '@babel/parser';
import { Parser } from './parser';

export class TypeScriptParser extends Parser {
	doParse(input: string, filename: string): boolean {
		const ast = parse(input, {
			allowAwaitOutsideFunction: true,
			allowImportExportEverywhere: true,
			allowReturnOutsideFunction: true,
			allowSuperOutsideMethod: true,
			allowUndeclaredExports: true,
			errorRecovery: true,
			sourceFilename: filename,
			sourceType: this.getSourceType(filename),
			plugins: [
				'typescript',
				'jsx',
				'classProperties',
				'classPrivateMethods',
				'classPrivateProperties',
				'decorators',
			],
		});

		return this.extract(filename, ast);
	}
}
