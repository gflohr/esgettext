import { decode, encodingExists } from 'iconv-lite';
import { Textdomain } from '@esgettext/runtime';
import { SourceLocation } from '@babel/types';
import { PoEntry } from '../translation-catalogue/po-entry';
import { CatalogueParser } from './catalogue-parser';
import { TranslationCatalogue } from '../translation-catalogue';

const gtx = Textdomain.getInstance('tools');

type Seen = {
	[key: string]: {
		[key: string]: SourceLocation;
	};
};

type ParserContext = {
	catalog: TranslationCatalogue;
	entry: PoEntry;
	loc: SourceLocation;
	entryLoc: SourceLocation;
	msgType: string;
	seen: Seen;
	errors: number;
	filename: string;
};

export class PoParser implements CatalogueParser {
	/**
	 * Parse a po file into a catalog. This parser is very forgiving and
	 * accepts input that actually does not follow the standard in certain
	 * areas.
	 *
	 * The encoding will always be read from the PO header if present.
	 *
	 * @param input - the content of the po file
	 * @param filename - the filename
	 * @param encoding - an optional encoding
	 */
	parse(
		buf: Buffer | string,
		filename: string,
		encoding?: string,
	): TranslationCatalogue | null {
		if (typeof encoding !== 'undefined') {
			if (!encodingExists(encoding)) {
				console.error(
					gtx._x('unsupported encoding "{encoding}"', { encoding }),
				);
				return null;
			}
		}

		let input: string;
		if (typeof buf === 'string') {
			input = buf;
		} else {
			input =
				typeof encoding === 'undefined'
					? buf.toString()
					: decode(buf, encoding);
		}

		const ctx: ParserContext = {
			catalog: new TranslationCatalogue(),
			entry: undefined as unknown as PoEntry,
			filename: filename,
			loc: {
				start: {
					line: 0,
					column: 1,
					index: 0,
				},
				end: {
					line: 0,
					column: 0,
					index: 0,
				},
				filename,
				identifierName: '',
			},
			entryLoc: {} as unknown as SourceLocation,
			msgType: undefined as unknown as string,
			seen: {},
			errors: 0,
		};

		// We cannot use forEach here because we may have to return from
		// inside the loop.
		const lines = input.split('\n');
		for (let i = 0; i < lines.length; ++i) {
			const line = lines[i];
			ctx.loc.start.column = 1;
			++ctx.loc.start.line;
			if (line === '') {
				if (
					ctx.entry &&
					ctx.entry.properties.msgid === '' &&
					typeof ctx.entry.properties.msgctxt === 'undefined' &&
					ctx.entry.properties.msgstr
				) {
					const charset = this.extractCharset(
						ctx,
						ctx.entry.properties.msgstr[0],
					);
					if (
						charset &&
						(typeof encoding === 'undefined' ||
							charset.toLowerCase() !== encoding.toLowerCase())
					) {
						// FIXME! This must only happen, if the header is the first
						// entry that has been added. Otherwise, we'll add the entries
						// before this, twice.
						return this.parse(buf, filename, charset);
					}
				}

				this.flushEntry(ctx);
			} else {
				const first = line[0];
				switch (first) {
					case '#':
						if (line.length > 1 && line[1] === '~') {
							if (ctx.entry) {
								this.error(ctx, gtx._('inconsistent use of #~'), ctx.loc);
							} else {
								break;
							}
						}
						if (!ctx.entry) {
							ctx.entry = PoEntry.build();
						}
						this.parseCommentLine(ctx, line);
						break;
					case 'm':
						if (!ctx.entry) {
							ctx.entry = PoEntry.build();
						}
						this.parseKeywordLine(ctx, line);
						break;
					case '"':
						if (!ctx.entry) {
							this.syntaxError(ctx);
						}
						this.parseQuotedString(ctx, line);
						break;
					default:
						if (
							(first >= 'A' && first <= 'Z') ||
							(first >= 'a' && first <= 'z')
						) {
							this.parseKeywordLine(ctx, line);
						}
						this.syntaxError(ctx);
				}
			}
		}

		if (
			ctx.entry &&
			ctx.entry.properties.msgid === '' &&
			typeof ctx.entry.properties.msgctxt === 'undefined' &&
			ctx.entry.properties.msgstr
		) {
			const charset = this.extractCharset(ctx, ctx.entry.properties.msgstr[0]);
			if (
				charset &&
				(typeof encoding === 'undefined' ||
					charset.toLowerCase() !== encoding.toLowerCase())
			) {
				// FIXME! This must only happen, if the header is the first
				// entry that has been added. Otherwise, we'll add the entries
				// before this, twice.
				return this.parse(buf, filename, charset);
			}
		}

		this.flushEntry(ctx);

		if (ctx.errors) {
			return null;
		}

		return ctx.catalog;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	doParse(_input: string, _filename: string): boolean {
		throw new Error('not implemented');
	}

	private extractCharset(ctx: ParserContext, header: string): string | null {
		const headers: { [key: string]: string } = {};

		header
			.split('\n')
			.map(line => line.split(':'))
			.map(chunks => ({
				name: chunks[0].toLowerCase(),
				value: chunks.slice(1).join(':').trim(),
			}))
			.filter(header => header.name !== '')
			.forEach(header => (headers[header.name] = header.value));

		const contentType = headers['content-type'];
		if (typeof contentType === 'undefined') {
			return null;
		}

		const tokens = contentType.split('=').map(token => token.trim());
		if (tokens.length <= 1) {
			return null;
		}

		const charset = tokens[tokens.length - 1];

		if (!encodingExists(charset)) {
			this.warn(
				ctx,
				gtx._x('the charset "{charset}" is not a portable encoding name.', {
					charset,
				}),
				ctx.loc,
			);
			this.warn(
				ctx,
				gtx._('message conversion to the users charset might not work.'),
				ctx.loc,
			);
			return null;
		}

		return charset;
	}

	private flushEntry(ctx: ParserContext): void {
		if (ctx.errors) {
			ctx.entry = undefined as unknown as PoEntry;
			return;
		}

		if (ctx.entry) {
			const msgctxt = ctx.entry.properties.msgctxt as string;
			const msgid = ctx.entry.properties.msgid;
			if (typeof msgid === 'undefined') {
				// TRANSLATORS: Do not translate "msgid".
				this.error(ctx, gtx._('missing "msgid" section'), ctx.loc);
				return;
			}
			if (ctx.seen[msgctxt] && ctx.seen[msgctxt][msgid]) {
				this.error(ctx, gtx._('duplicate message definition...'), ctx.entryLoc);
				this.error(
					ctx,
					gtx._('...this is the location of the first definition'),
					ctx.seen[msgctxt][msgid],
				);
				return;
			}
			if (!ctx.seen[msgctxt]) {
				ctx.seen[msgctxt] = {};
			}

			ctx.seen[msgctxt][msgid] = this.copyLocation(ctx.entryLoc);
			ctx.catalog.addEntry(ctx.entry);
		}
		ctx.entry = undefined as unknown as PoEntry;
	}

	private parseCommentLine(ctx: ParserContext, line: string): void {
		const marker = line[1];
		switch (marker) {
			case ',':
				this.parseFlags(ctx, line);
				break;

			case ':':
				this.parseReferences(ctx, line);
				break;

			case '.':
				ctx.entry.addExtractedCommentLine(line.substr(1).trim());
				break;

			case ' ':
				ctx.entry.addTranslatorCommentLine(line.substr(2));
				break;

			default:
				ctx.entry.addTranslatorCommentLine(line.substr(1));
				break;
		}
	}

	private parseKeywordLine(ctx: ParserContext, line: string): void {
		const errorsBefore = ctx.errors;

		let remainder = line.replace(/^[_A-Za-z0-9[\]]+/, keyword => {
			switch (keyword) {
				case 'msgid':
					ctx.entryLoc = this.copyLocation(ctx.loc);
					ctx.msgType = keyword;
					if (typeof ctx.entry.properties.msgid !== 'undefined') {
						this.error(
							ctx,
							gtx._x('duplicate "{keyword}" section', { keyword }),
							ctx.loc,
						);
					}
					break;
				case 'msgstr':
					ctx.msgType = keyword;
					if (typeof ctx.entry.properties.msgstr !== 'undefined') {
						this.error(
							ctx,
							gtx._x('duplicate "{keyword}" section', { keyword }),
							ctx.loc,
						);
					}
					break;
				case 'msgid_plural':
					ctx.msgType = keyword;
					if (typeof ctx.entry.properties.msgidPlural !== 'undefined') {
						this.error(
							ctx,
							gtx._x('duplicate "{keyword}" section', { keyword }),
							ctx.loc,
						);
					}
					break;
				case 'msgctxt':
					ctx.msgType = keyword;
					if (typeof ctx.entry.properties.msgctxt !== 'undefined') {
						this.error(
							ctx,
							gtx._x('duplicate "{keyword}" section', { keyword }),
							ctx.loc,
						);
					}
					break;
				default:
					if (!/^msgstr\[[0-9]+\]/.exec(keyword)) {
						this.error(
							ctx,
							gtx._x('keyword "{keyword}" unknown', { keyword }),
							ctx.loc,
						);
					}
					ctx.msgType = keyword;
			}

			ctx.loc.start.column += keyword.length;

			return '';
		});

		if (errorsBefore !== ctx.errors) {
			return;
		}

		remainder = this.trim(ctx, remainder);
		if (remainder.startsWith('"')) {
			return this.parseQuotedString(ctx, remainder);
		} else {
			this.syntaxError(ctx);
		}
	}

	private parseQuotedString(ctx: ParserContext, line: string): void {
		if (!line.endsWith('"')) {
			ctx.loc.start.column += line.length;
			this.error(ctx, gtx._('end-of-line within string'), ctx.loc);
			return;
		}

		const raw = line.substr(1, line.length - 2);
		if (raw.length && raw.endsWith('\\')) {
			this.error(ctx, gtx._('end-of-line within string'), ctx.loc);
			return;
		}
		const msg = raw.replace(/\\./g, (match, offset) => {
			let retval: string;

			switch (match[1]) {
				case '\\':
				case '"':
					retval = match[1];
					break;
				case 'a':
					retval = '\u0007';
					break;
				case 'b':
					retval = '\b';
					break;
				case 't':
					retval = '\t';
					break;
				case 'n':
					retval = '\n';
					break;
				case 'v':
					retval = '\v';
					break;
				case 'f':
					retval = '\f';
					break;
				case 'r':
					retval = '\r';
					break;
				default:
					// We have to take the leading quote into account.
					ctx.loc.start.column += offset + 1;
					this.error(ctx, gtx._('invalid control sequence'), ctx.loc);
					retval = '';
			}

			return retval;
		});

		if (ctx.errors) {
			return;
		}

		switch (ctx.msgType) {
			case 'msgid':
				ctx.entry.addToMsgid(msg);
				break;
			case 'msgstr':
				ctx.entry.addToMsgstr(msg);
				break;
			case 'msgid_plural':
				ctx.entry.addToMsgidPlural(msg);
				break;
			case 'msgctxt':
				ctx.entry.addToMsgctxt(msg);
				break;
			default:
				// FIXME! Do not ignore plural translations!
				break;
		}
	}

	private parseFlags(ctx: ParserContext, line: string): void {
		const flags = line.substr(2).split(',');
		flags.forEach((flag, i) => {
			if (i) {
				++ctx.loc.start.column;
			}

			const rspace = this.rspace(flag);
			flag = this.trim(ctx, flag);
			if (!flag.length) {
				this.warn(ctx, gtx._('ignoring empty flag'), ctx.loc);
			} else {
				ctx.entry.addFlag(flag);
			}
			ctx.loc.start.column += rspace + flag.length;
		});
	}

	private parseReferences(ctx: ParserContext, line: string): void {
		ctx.loc.start.column += 2;

		const refs = line.substr(2).split(' ');
		refs.forEach((reference, i) => {
			if (i) {
				++ctx.loc.start.column;
			}

			reference = this.trim(ctx, reference);

			if (/.+:[1-9][0-9]*$/.exec(reference)) {
				ctx.entry.addReference(reference);
			} else if (reference !== '') {
				this.warn(
					ctx,
					gtx._x('ignoring mal-formed reference "{reference}"', {
						reference,
					}),
					ctx.loc,
				);
			}
			ctx.loc.start.column += reference.length;
		});
	}

	private syntaxError(ctx: ParserContext): void {
		this.error(ctx, gtx._('syntax error'), ctx.loc);
	}

	private trim(ctx: ParserContext, str: string): string {
		return str
			.replace(/^[\s\uFEFF\xA0]+/, match => {
				ctx.loc.start.column += match.length;
				return '';
			})
			.trim();
	}

	private rspace(str: string): number {
		const space = /[\s\uFEFF\xA0]+$/.exec(str);
		if (space) {
			return space[0].length;
		} else {
			return 0;
		}
	}

	private copyLocation(loc: SourceLocation): SourceLocation {
		return {
			start: {
				line: loc.start.line,
				column: loc.start.column,
			},
			end: {
				line: 0,
				column: 0,
				index: 0,
			},
			filename: '',
			identifierName: null,
		} as SourceLocation;
	}

	// FIXME! Allow to hook in here and replace console.warn() with a user
	// supplied function.
	protected warn(ctx: ParserContext, msg: string, loc: SourceLocation): void {
		const start = `${loc.start.line}:${loc.start.column}`;
		const end = loc.end.line > 0 ? `-${loc.end.line}:${loc.end.column}` : '';
		const filename =
			'-' === ctx.filename ? gtx._('[standard input]') : ctx.filename;
		const location = `${filename}:${start}${end}`;
		console.warn(gtx._x('{location}: warning: {msg}', { location, msg }));
	}

	// FIXME! Allow to hook in here and replace console.error() with a user
	// supplied function.
	private error(ctx: ParserContext, msg: string, loc: SourceLocation): void {
		++ctx.errors;
		const start = `${loc.start.line}:${loc.start.column}`;
		const end =
			loc.end && loc.end.line > 0 ? `-${loc.end.line}:${loc.end.column}` : '';
		const filename =
			'-' === ctx.filename ? gtx._('[standard input]') : ctx.filename;
		const location = `${filename}:${start}${end}`;
		console.error(gtx._x('{location}: Error: {msg}', { location, msg }));
	}
}
