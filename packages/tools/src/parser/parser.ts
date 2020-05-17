import { readFileSync } from 'fs';
import {
	File,
	StringLiteral,
	SourceLocation,
	CommentBlock,
} from '@babel/types';
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
		const comments = ast.comments as Array<CommentBlock>;

		traverse(ast, {
			StringLiteral: (path) => {
				const loc = path.node.loc;
				const str = this.extractString(path);
				if (str !== null) {
					this.addEntry(str, loc, comments);
				}
			},
			DirectiveLiteral: (path) => {
				const loc = path.node.loc;
				const str = this.extractString(
					(path as unknown) as NodePath<StringLiteral>,
				);
				if (str !== null) {
					this.addEntry(str, loc, comments);
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
		remainingComments: Array<CommentBlock>,
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

		const commentBlocks = this.findPrecedingComments(remainingComments, loc);
		const extractedComments = commentBlocks.map((block) => block.value.trim());

		this.catalog.addEntry(
			new POTEntry({
				msgid,
				msgidPlural,
				flags,
				references,
				extractedComments,
			}),
		);
	}

	private findPrecedingComments(
		comments: Array<CommentBlock>,
		loc: SourceLocation,
	): Array<CommentBlock> {
		let last;

		// Find the last relevant comment, which is the first one that
		// immediately precedes the location.
		for (last = 0; last < comments.length; ++last) {
			const commentLocation = comments[last].loc;
			if (
				commentLocation.end.line === loc.start.line ||
				commentLocation.end.line === loc.start.line - 1
			) {
				break;
			} else if (commentLocation.end.line > loc.start.line) {
				comments.splice(0, last);
				return [];
			}
		}

		if (last >= comments.length) {
			comments.splice(0, comments.length);
			return [];
		}

		// Now go back and find all adjacent comments.
		let ptr = comments[last].loc;
		const preceding = comments.splice(0, last + 1);

		if (!last) {
			return preceding;
		}

		let first;
		for (first = preceding.length - 2; first >= 0; --first) {
			const commentLocation = preceding[first].loc;
			if (commentLocation.end.line < ptr.start.line - 1) {
				break;
			}
			ptr = commentLocation;
		}

		return preceding.slice(first + 1);
	}
}
