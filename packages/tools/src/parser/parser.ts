import { readFileSync } from 'fs';
import { File, StringLiteral, SourceLocation } from '@babel/types';
import traverse, { NodePath } from '@babel/traverse';

import { Catalog } from '../pot/catalog';
import { POTEntry } from '../pot/entry';

export abstract class Parser {
	constructor(
		protected readonly catalog: Catalog,
		protected readonly warner: (msg: string) => void,
	) {}

	abstract parse(input: Buffer, filename: string, encoding?: string): void;

	parseFile(filename: string, encoding?: string): void {
		return this.parse(readFileSync(filename), filename, encoding);
	}

	protected extractAllStrings(ast: File): void {
		traverse(ast, {
			StringLiteral: (path) => {
				const loc = path.node.loc;
				const str = this.extractString(path);
				if (str !== null) {
					this.addEntry(str, loc);
				}
			},
			DirectiveLiteral: (path) => {
				const loc = path.node.loc;
				const str = this.extractString(
					(path as unknown) as NodePath<StringLiteral>,
				);
				if (str !== null) {
					this.addEntry(str, loc);
				}
			},
		});
	}

	private extractString(path: NodePath<StringLiteral>): string {
		return path.node.value;
	}

	private addEntry(
		msgid: string,
		loc: SourceLocation,
		msgidPlural?: string,
	): void {
		let flags;
		if (/\{[_a-zA-Z][_a-zA-Z0-9]*\}/.exec(msgid)) {
			flags = new Array<string>();
			flags.push('perl-brace-format');
		}

		const dict: { [key: string]: string } = (loc as unknown) as {
			[key: string]: string;
		};
		const references = [`${dict.filename}:${loc.start.line}`];

		this.catalog.addEntry(
			new POTEntry({
				msgid,
				msgidPlural,
				flags,
				references,
			}),
		);
	}
}
