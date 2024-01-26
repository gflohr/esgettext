import { decode } from 'iconv-lite';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import { Textdomain } from '@esgettext/runtime';
import { Catalog } from '../pot/catalog';
import { POTEntry } from '../pot/entry';
import { Keyword } from '../pot/keyword';

/* eslint-disable no-console */

const gtx = Textdomain.getInstance('tools');

interface EntryProperties {
	msgid: string;
	loc: t.SourceLocation;
	method?: string;
	msgidPlural?: string;
	msgctxt?: string;
	comment?: string;
	flag?: Array<string>;
}

export interface ParserOptions {
	addAllComments?: boolean;
	addComments?: Array<string>;
	extractAll?: boolean;
	keyword?: Array<Keyword>;
	instance?: Array<string>;
	fromCode?: string;
}

export abstract class Parser {
	protected filename: string;
	protected errors: number;
	private comments: Array<t.CommentBlock>;
	private readonly instances: Array<Array<string>>;

	private readonly keywords: {
		[key: string]: Keyword;
	};

	constructor(
		protected readonly catalog: Catalog,
		protected readonly options: ParserOptions = {},
	) {
		this.keywords = {};
		(options.keyword || Parser.cookedDefaultKeywords()).forEach(keyword => {
			this.keywords[keyword.method] = keyword;
		});
		if (options.instance) {
			this.instances = new Array<Array<string>>();
			for (let i = 0; i < options.instance.length; ++i) {
				this.instances[i] = options.instance[i].split('.').reverse();
			}
		}
	}

	protected abstract doParse(input: string, filename: string): boolean;

	parse(buf: Buffer, filename: string): boolean {
		this.filename = filename;

		const encoding =
			typeof this.options.fromCode === 'undefined'
				? 'ascii'
				: this.options.fromCode;
		const canonical = this.canonicalizeEncoding(encoding);

		let input;
		let pos = 0;
		if ('ascii' === canonical) {
			if (
				buf.find((ord, idx) => {
					if (ord > 0x7f) {
						pos = idx;
						return true;
					} else {
						return false;
					}
				})
			) {
				const loc: t.SourceLocation = {
					start: {
						line: 1,
						column: 1,
						index: 0,
					},
					end: {
						line: 0,
						column: 0,
						index: 0,
					},
					filename,
					identifierName: null,
				};

				// Find the offending character.
				for (let i = 0; i < pos; ++i) {
					if (buf[i] === 10) {
						++loc.start.line;
						loc.start.column = 1;
					} else {
						++loc.start.column;
					}
				}

				this.error(
					gtx._(
						'Non-ASCII character.\n' +
							'Please specify the encoding through "--from-code".',
					),
					loc,
				);
				return false;
			}
			input = buf.toString();
		} else if ('utf8' === canonical) {
			const loc = this.findNonUtf8(buf);
			if (loc !== null) {
				this.error(gtx._('invalid multibyte sequence'), loc);
				return false;
			}
			input = buf.toString();
		} else {
			// Convert.
			try {
				input = decode(buf, this.options.fromCode);
			} catch (e) {
				const usedFilename =
					'-' === filename ? gtx._('[standard input]') : filename;
				console.error(`${usedFilename}: ${e}`);
				return false;
			}
		}

		return this.doParse(input, filename);
	}

	protected extract(filename: string, ast: t.File): boolean {
		this.errors = 0;
		this.comments = this.filterComments(ast.comments as Array<t.CommentBlock>);

		this.filename = filename;
		if (this.options.extractAll) {
			this.extractAllStrings(ast);
		} else {
			this.extractStrings(ast);
		}

		return !this.errors;
	}

	private extractStrings(ast: t.File): void {
		traverse(ast, {
			CallExpression: path => {
				this.extractArguments(path);
			},
		});
	}

	private extractAllStrings(ast: t.File): void {
		// Step 1: Transform string concatenations into one string.
		traverse(ast, {
			StringLiteral: path => {
				this.concatStrings(path);
			},
		});

		// Step 2: Extract the remaining strings. Those that are part of a
		// binary expression have not been recognized in step 1 and must be
		// ignored.
		traverse(ast, {
			StringLiteral: path => {
				if (!t.isBinaryExpression(path.parentPath.node)) {
					const loc = path.node.loc;
					this.addEntry({ msgid: path.node.value, loc });
				}
			},
		});
	}

	private checkPath(wanted: Array<string>, got: Array<string>): boolean {
		for (let i = 0; i < got.length; ++i) {
			if (i >= wanted.length) {
				return true;
			} else if (wanted[i] !== got[i]) {
				return false;
			}
		}

		return true;
	}

	private checkInstance(instance: Array<string>): boolean {
		if (!this.options.instance) {
			return true;
		}

		for (let i = 0; i < this.instances.length; ++i) {
			if (this.checkPath(this.instances[i], instance)) {
				return true;
			}
		}

		return false;
	}

	private extractArguments(path: NodePath<t.CallExpression>): void {
		let method: string;
		if (t.isIdentifier(path.node.callee) && !this.instances) {
			method = path.node.callee.name;
		} else if (t.isMemberExpression(path.node.callee)) {
			const instance = new Array<string>();
			method = this.methodFromMemberExpression(path.node.callee, instance);
			if (method === null) {
				return;
			}
			instance.shift();
			if (!this.checkInstance(instance)) {
				return;
			}
		} else {
			return;
		}

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

		const msgid = this.extractArgument(
			path.node.arguments[keywordSpec.singular - 1],
		);
		if (msgid === null) {
			return;
		}

		let msgidPlural;
		if (keywordSpec.plural) {
			msgidPlural = this.extractArgument(
				path.node.arguments[keywordSpec.plural - 1],
			);
			if (msgidPlural === null) {
				return;
			}
		}

		let msgctxt;
		if (keywordSpec.context) {
			msgctxt = this.extractArgument(
				path.node.arguments[keywordSpec.context - 1],
			);
			if (msgctxt === null) {
				return;
			}
		}

		this.addEntry({ msgid, loc: path.node.loc, method, msgidPlural, msgctxt });
	}

	/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
	private extractArgument(argument: any): string {
		if (t.isStringLiteral(argument)) {
			return argument.value;
		} else if (t.isBinaryExpression(argument)) {
			return this.extractBinaryExpression(argument);
		} else if (t.isTemplateLiteral(argument)) {
			return this.extractTemplateLiteral(argument);
		}

		return null;
	}

	private extractBinaryExpression(exp: t.BinaryExpression): string {
		const left = this.extractArgument(exp.left);
		if (left === null) {
			return null;
		}
		const right = this.extractArgument(exp.right);
		if (right === null) {
			return null;
		}

		return left + right;
	}

	private extractTemplateLiteral(literal: t.TemplateLiteral): string {
		if (
			literal.expressions.length === 0 &&
			literal.quasis.length === 1 &&
			t.isTemplateElement(literal.quasis[0])
		) {
			return literal.quasis[0].value.cooked;
		}

		this.error(
			gtx._(
				'template literals with embedded expressions are not' +
					' allowed as arguments to gettext functions because they' +
					' are not constant',
			),
			literal.loc as t.SourceLocation,
		);

		return null;
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
			parentPath.replaceInline(node);
		}
	}

	private addEntry(props: EntryProperties): void {
		props.flag = new Array<string>();

		const dict: { [key: string]: string } = props.loc as unknown as {
			[key: string]: string;
		};
		let references: Array<string> = [];
		if (dict !== null && typeof dict !== 'undefined') {
			const filename = '-' === dict.filename ? '[stdin]' : dict.filename;
			references = [`${filename}:${props.loc.start.line}`];
		}

		const commentBlocks = this.findPrecedingComments(props.loc);
		let extractedComments = commentBlocks.map(block => block.value.trim());

		if (typeof props.method !== 'undefined') {
			extractedComments = extractedComments
				.map(comment => {
					const match = /xgettext:(.*)/.exec(comment);

					if (match) {
						const str = match[1];
						const validTokens = ['fuzzy', 'wrap', 'no-wrap'];
						const tokens = str.split(/[ \x09-\x0d]+/);
						tokens.forEach(token => {
							if (
								validTokens.includes(token) ||
								/^(?:[a-z]+-)+(?:format|check)$/.exec(token)
							) {
								(props.flag as string[]).push(token);
							}
						});
						comment = '';
					}

					return comment;
				})
				.filter(comment => comment !== '');
		}

		if (
			!props.flag.includes('no-perl-brace-format') &&
			/\{[_a-zA-Z][_a-zA-Z0-9]*\}/.exec(props.msgid)
		) {
			props.flag.push('perl-brace-format');
		}

		this.catalog.addEntry(
			new POTEntry({
				msgid: props.msgid,
				msgidPlural: props.msgidPlural,
				msgctxt: props.msgctxt,
				flags: props.flag,
				references,
				extractedComments,
			}),
		);
	}

	private methodFromMemberExpression(
		me: t.MemberExpression,
		instance: Array<string> = [],
	): string | null {
		if (t.isIdentifier(me.object)) {
			if (t.isLiteral(me.property) && me.computed) {
				instance.push(this.literalValue(me.property) as string);
				instance.push(me.object.name);
				return instance[0];
			} else if (t.isIdentifier(me.property) && !me.computed) {
				instance.push(me.property.name);
				instance.push(me.object.name);
				return instance[0];
			} else {
				return null;
			}
		} else if (
			t.isMemberExpression(me.object) &&
			t.isIdentifier(me.property) &&
			!me.computed
		) {
			// Recurse.
			instance.push(me.property.name);
			return this.methodFromMemberExpression(me.object, instance);
		} else if (
			t.isMemberExpression(me.object) &&
			t.isLiteral(me.property) &&
			me.computed
		) {
			// Recurse.
			instance.push(this.literalValue(me.property) as string);
			return this.methodFromMemberExpression(me.object, instance);
		} else {
			return null;
		}
	}

	private literalValue(node: t.Literal): string | null | undefined {
		if (t.isStringLiteral(node)) {
			return node.value;
		} else if (
			t.isTemplateLiteral(node) &&
			node.expressions.length === 0 &&
			node.quasis.length === 1 &&
			t.isTemplateElement(node.quasis[0])
		) {
			return node.quasis[0].value.cooked;
		} else {
			return null;
		}
	}

	private findPrecedingComments(loc: t.SourceLocation): Array<t.CommentBlock> {
		let last;

		// Find the last relevant comment, which is the first one that
		// immediately precedes the location.
		for (last = 0; last < this.comments.length; ++last) {
			const commentLocation = this.comments[last].loc as t.SourceLocation;
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
			if (commentLocation && commentLocation.end.line < (ptr as t.SourceLocation).start.line - 1) {
				break;
			}
			ptr = commentLocation;
		}

		return preceding.slice(first + 1);
	}

	private filterComments(
		comments: Array<t.CommentBlock>,
	): Array<t.CommentBlock> {
		if (this.options.addAllComments) {
			return comments;
		}

		const markers = this.options.addComments
			? this.options.addComments
			: new Array<string>();

		return comments.filter(block => {
			if (block.value.includes('xgettext:')) {
				return true;
			} else {
				for (let i = 0; i < markers.length; ++i) {
					const marker = markers[i].trim();
					if (marker === block.value.trim().substr(0, marker.length)) {
						return true;
					}
				}
			}

			return false;
		});
	}

	private static cookedDefaultKeywords(): Array<Keyword> {
		return Parser.defaultKeywords().map(keyword => Keyword.from(keyword));
	}

	private static defaultKeywords(): Array<string> {
		return [
			'_',
			'_x',
			'_n:1,2',
			'_nx:1,2',
			'_p:1c,2',
			'_px:1c,2',
			'_np:1c,2,3',
			'_npx:1c,2,3',
			'N_',
			'N_x',
			'N_p:1c,2',
			'N_px:1c,2',
			'_l:2',
			'_lx:2',
			'_ln:2,3',
			'_lnx:2,3',
			'_lp:2c,3',
			'_lpx:2c,3',
			'_lnp:2c,3,4',
			'_lnpx:2c,3,4',
			'N_l:2',
			'N_lx:2',
			'N_lp:2c,3',
			'N_lpx:2c,3',
		];
	}

	protected warn(msg: string, loc: t.SourceLocation): void {
		const start = `${loc.start.line}:${loc.start.column}`;
		const end = loc.end ? `-${loc.end.line}:${loc.end.column}` : '';
		const filename =
			'-' === this.filename ? gtx._('[standard input]') : this.filename;
		const location = `${filename}:${start}${end}`;
		console.warn(gtx._x('{location}: warning: {msg}', { location, msg }));
	}

	protected error(msg: string, loc: t.SourceLocation): void {
		++this.errors;
		const start = `${loc.start.line}:${loc.start.column}`;
		const end = loc.end && loc.end.line > 0 ? `-${loc.end.line}:${loc.end.column}` : '';
		const filename =
			'-' === this.filename ? gtx._('[standard input]') : this.filename;
		const location = `${filename}:${start}${end}`;
		console.error(gtx._x('{location}: error: {msg}', { location, msg }));
	}

	private canonicalizeEncoding(encoding: string): string {
		// This is taken from iconv-lite.
		const canonical = ('' + encoding)
			.toLowerCase()
			.replace(/:[0-9]{4}$|[^0-9a-z]/g, '');
		const asciiAliases = [
			'ascii8bit',
			'usascii',
			'ansix34',
			'ansix341968',
			'ansix341986',
			'csascii',
			'cp367',
			'ibm367',
			'isoir6',
			'iso646us',
			'iso646irv',
			'us',
		];
		if (asciiAliases.includes(canonical)) {
			return 'ascii';
		} else {
			return canonical;
		}
	}

	private findNonUtf8(buf: Buffer): t.SourceLocation | null {
		let i = 0;
		const loc: t.SourceLocation = {
			start: {
				line: 1,
				column: 1,
				index: 0,
			},
			end: {
				line: 0,
				column: 0,
				index: 0,
			},
			filename: '',
			identifierName: '',
		};
		while (i < buf.length) {
			if (
				buf[i] === 0x09 ||
				buf[i] === 0x0a ||
				buf[i] === 0x0 ||
				(0x20 <= buf[i] && buf[i] <= 0x7e)
			) {
				if (buf[i] === 0x0a) {
					++loc.start.line;
					loc.start.column = 1;
				} else {
					++loc.start.column;
				}
				++i;
				continue;
			}

			if (
				0xc2 <= buf[i] &&
				buf[i] <= 0xdf &&
				0x80 <= buf[i + 1] &&
				buf[i + 1] <= 0xbf
			) {
				i += 2;
				loc.start.column += 2;
				continue;
			}

			if (
				(buf[i] === 0xe0 &&
					0xa0 <= buf[i + 1] &&
					buf[i + 1] <= 0xbf &&
					0x80 <= buf[i + 2] &&
					buf[i + 2] <= 0xbf) ||
				(((0xe1 <= buf[i] && buf[i] <= 0xec) ||
					buf[i] === 0xee ||
					buf[i] === 0xef) &&
					0x80 <= buf[i + 1] &&
					buf[i + 1] <= 0xbf &&
					0x80 <= buf[i + 2] &&
					buf[i + 2] <= 0xbf) ||
				(buf[i] === 0xed &&
					0x80 <= buf[i + 1] &&
					buf[i + 1] <= 0x9f &&
					0x80 <= buf[i + 2] &&
					buf[i + 2] <= 0xbf)
			) {
				i += 3;
				loc.start.column += 3;
				continue;
			}

			if (
				(buf[i] === 0xf0 &&
					0x90 <= buf[i + 1] &&
					buf[i + 1] <= 0xbf &&
					0x80 <= buf[i + 2] &&
					buf[i + 2] <= 0xbf &&
					0x80 <= buf[i + 3] &&
					buf[i + 3] <= 0xbf) ||
				(0xf1 <= buf[i] &&
					buf[i] <= 0xf3 &&
					0x80 <= buf[i + 1] &&
					buf[i + 1] <= 0xbf &&
					0x80 <= buf[i + 2] &&
					buf[i + 2] <= 0xbf &&
					0x80 <= buf[i + 3] &&
					buf[i + 3] <= 0xbf) ||
				(buf[i] === 0xf4 &&
					0x80 <= buf[i + 1] &&
					buf[i + 1] <= 0x8f &&
					0x80 <= buf[i + 2] &&
					buf[i + 2] <= 0xbf &&
					0x80 <= buf[i + 3] &&
					buf[i + 3] <= 0xbf)
			) {
				i += 4;
				loc.start.column += 4;
				continue;
			}

			return loc;
		}

		return null;
	}
}
