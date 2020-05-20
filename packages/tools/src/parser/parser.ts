import { readFileSync } from 'fs';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import { Catalog } from '../pot/catalog';
import { POTEntry } from '../pot/entry';
import { Keyword } from '../pot/keyword';

export abstract class Parser {
	private readonly keywords: {
		[key: string]: Keyword;
	};

	constructor(
		protected readonly catalog: Catalog,
		protected readonly warner: (msg: string) => void,
	) {
		this.keywords = {};
		(catalog.properties.keywords || []).forEach((keyword) => {
			this.keywords[keyword.method] = keyword;
		});
	}

	abstract parse(input: Buffer, filename: string, encoding?: string): void;

	parseFile(filename: string, encoding?: string): void {
		return this.parse(readFileSync(filename), filename, encoding);
	}

	protected extract(ast: t.File): void {
		if (this.catalog.properties.extractAll) {
			this.extractAllStrings(ast);
		} else {
			this.extractStrings(ast);
		}
	}

	private extractStrings(_ast: t.File): void {
		/* todo */
	}

	private extractAllStrings(ast: t.File): void {
		const comments = this.filterComments(ast.comments as Array<t.CommentBlock>);

		// Step 1: Transform string concatenations into one string.
		traverse(ast, {
			StringLiteral: (path) => {
				this.concatStrings(path);
			},
		});

		// Step 2: Extract the remaining strings. Those that are part of a
		// binary expression have not been recognized in step 1 and must be
		// ignored.
		traverse(ast, {
			StringLiteral: (path) => {
				if (!t.isBinaryExpression(path.parentPath.node)) {
					const loc = path.node.loc;
					this.addEntry(path.node.value, loc, comments);
				}
			},
		});
	}

	private concatStrings(path: NodePath<t.StringLiteral>): void {
		if (!t.isBinaryExpression(path.parent)) {
			return;
		}

		const parentPath = path.parentPath as NodePath<t.BinaryExpression>;
		if (
			parentPath.node.operator === '+' &&
			t.isStringLiteral(parentPath.node.left) &&
			t.isStringLiteral(parentPath.node.right)
		) {
			const node = t.stringLiteral(
				parentPath.node.left.value + parentPath.node.right.value,
			);
			node.loc = parentPath.node.loc;
			parentPath.replaceWith(node);
		}
	}

	private addEntry(
		msgid: string,
		loc: t.SourceLocation,
		remainingComments: Array<t.CommentBlock>,
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
		comments: Array<t.CommentBlock>,
		loc: t.SourceLocation,
	): Array<t.CommentBlock> {
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

	private filterComments(
		comments: Array<t.CommentBlock>,
	): Array<t.CommentBlock> {
		if (this.catalog.properties.addAllComments) {
			return comments;
		}

		const markers = this.catalog.properties.addComments
			? this.catalog.properties.addComments
			: new Array<string>();

		return comments.filter((block) => {
			if (block.value.includes('xgettext:')) {
				return true;
			} else {
				for (let i = 0; i < markers.length; ++i) {
					const marker = markers[i];
					if (marker === block.value.substr(0, marker.length)) {
						return true;
					}
				}
			}

			return false;
		});
	}
}
