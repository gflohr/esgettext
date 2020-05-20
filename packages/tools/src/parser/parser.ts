import { readFileSync } from 'fs';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import { Textdomain } from '@esgettext/runtime';
import { Catalog } from '../pot/catalog';
import { POTEntry } from '../pot/entry';
import { Keyword } from '../pot/keyword';

const gtx = Textdomain.getInstance('esgettext-tools');

export abstract class Parser {
	protected filename: string;
	protected errors: number;
	private comments: Array<t.CommentBlock>;

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

	protected extract(filename: string, ast: t.File): boolean {
		this.errors = 0;
		this.comments = this.filterComments(ast.comments as Array<t.CommentBlock>);

		this.filename = filename;
		if (this.catalog.properties.extractAll) {
			this.extractAllStrings(ast);
		} else {
			this.extractStrings(ast);
		}

		if (this.errors) {
			return false;
		} else {
			return true;
		}
	}

	private extractStrings(ast: t.File): void {
		traverse(ast, {
			CallExpression: (path) => {
				this.extractArguments(path);
			},
		});
	}

	private extractAllStrings(ast: t.File): void {
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
					this.addEntry(path.node.value, loc);
				}
			},
		});
	}

	private extractArguments(path: NodePath<t.CallExpression>): void {
		if (path.node.callee.type !== 'Identifier') {
			return;
		}

		const method = path.node.callee.name;
		if (!Object.prototype.hasOwnProperty.call(this.keywords, method)) {
			return;
		}

		// Enough arguments?
		const keywordSpec = this.keywords[method];
		if (
			keywordSpec.totalArgs &&
			path.node.arguments.length !== keywordSpec.totalArgs
		) {
			return;
		}

		if (keywordSpec.singular > path.node.arguments.length) {
			return;
		}

		if (keywordSpec.plural && keywordSpec.plural > path.node.arguments.length) {
			return;
		}

		if (
			keywordSpec.context &&
			keywordSpec.context > path.node.arguments.length
		) {
			return;
		}

		const sgArg = path.node.arguments[keywordSpec.singular - 1];
		let msgid;
		if (t.isStringLiteral(sgArg)) {
			msgid = sgArg.value;
		} else if (t.isBinaryExpression(sgArg)) {
			throw new Error('not yet implemented');
		} else if (t.isTemplateElement(sgArg)) {
			this.error(
				gtx._(
					'template strings are not allowed as arguments to gettext functions',
				),
				sgArg.loc,
			);
			return;
		} else {
			return;
		}

		this.addEntry(msgid, path.node.loc);
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

		const commentBlocks = this.findPrecedingComments(loc);
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

	private findPrecedingComments(loc: t.SourceLocation): Array<t.CommentBlock> {
		let last;

		// Find the last relevant comment, which is the first one that
		// immediately precedes the location.
		for (last = 0; last < this.comments.length; ++last) {
			const commentLocation = this.comments[last].loc;
			if (
				commentLocation.end.line === loc.start.line ||
				commentLocation.end.line === loc.start.line - 1
			) {
				break;
			} else if (commentLocation.end.line > loc.start.line) {
				this.comments.splice(0, last);
				return [];
			}
		}

		if (last >= this.comments.length) {
			this.comments.splice(0, this.comments.length);
			return [];
		}

		// Now go back and find all adjacent comments.
		let ptr = this.comments[last].loc;
		const preceding = this.comments.splice(0, last + 1);

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

	protected warn(msg: string, loc: t.SourceLocation): void {
		const start = `${loc.start.line}:${loc.start.column}`;
		const end = loc.end ? `-${loc.end.line}:${loc.end.column}` : '';
		const location = `${this.filename}:${start}${end}`;
		this.warner(gtx._x('{location}: warning: {msg}', { location, msg }));
	}

	protected error(msg: string, loc: t.SourceLocation): void {
		++this.errors;
		const start = `${loc.start.line}:${loc.start.column}`;
		const end = loc.end ? `-${loc.end.line}:${loc.end.column}` : '';
		const location = `${this.filename}:${start}${end}`;
		this.warner(gtx._x('{location}: error: {msg}', { location, msg }));
	}
}
