import { decode, encodingExists } from 'iconv-lite';
import { Textdomain } from '@esgettext/runtime';
import { SourceLocation } from '@babel/types';
import { POTEntry } from '../pot/entry';
import { Parser } from './parser';

const gtx = Textdomain.getInstance('esgettext-tools');

/* eslint-disable no-console */

export class PoParser extends Parser {
	private entry: POTEntry;
	private loc: SourceLocation;
	private entryLoc: SourceLocation;
	private msgType: string = null;
	private seen: {
		[key: string]: {
			[key: string]: SourceLocation;
		};
	};

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
	parse(buf: Buffer, filename: string, encoding?: string): boolean {
		if (typeof encoding !== 'undefined') {
			if (!encodingExists(encoding)) {
				console.error(
					gtx._x('unsupported encoding "{encoding}"', { encoding }),
				);
				return false;
			}
		}

		const input =
			typeof encoding === 'undefined' ? buf.toString() : decode(buf, encoding);

		// Reset parser.
		this.entry = undefined;
		this.filename = filename;
		this.loc = {
			start: {
				line: 0,
				column: 1,
			},
			end: null,
		};
		this.msgType = null;
		this.seen = {};
		this.errors = 0;

		// We cannot use forEach here because we may have to return from
		// inside the loop.
		const lines = input.split('\n');
		for (let i = 0; i < lines.length; ++i) {
			const line = lines[i];
			this.loc.start.column = 1;
			++this.loc.start.line;
			if (line === '') {
				if (
					this.entry &&
					this.entry.properties.msgid === '' &&
					typeof this.entry.properties.msgctxt === 'undefined' &&
					this.entry.properties.msgstr
				) {
					const charset = this.extractCharset(this.entry.properties.msgstr);
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

				this.flushEntry();
			} else {
				const first = line[0];
				switch (first) {
					case '#':
						if (line.length > 1 && line[1] === '~') {
							if (this.entry) {
								this.error(gtx._('inconsistent use of #~'), this.loc);
							} else {
								break;
							}
						}
						if (!this.entry) {
							this.entry = POTEntry.build();
						}
						this.parseCommentLine(line);
						break;
					case 'm':
						if (!this.entry) {
							this.entry = POTEntry.build();
						}
						this.parseKeywordLine(line);
						break;
					case '"':
						if (!this.entry) {
							this.syntaxError();
						}
						this.parseQuotedString(line);
						break;
					default:
						if (
							(first >= 'A' && first <= 'Z') ||
							(first >= 'a' && first <= 'z')
						) {
							this.parseKeywordLine(line);
						}
						this.syntaxError();
				}
			}
		}

		if (
			this.entry &&
			this.entry.properties.msgid === '' &&
			typeof this.entry.properties.msgctxt === 'undefined' &&
			this.entry.properties.msgstr
		) {
			const charset = this.extractCharset(this.entry.properties.msgstr);
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

		this.flushEntry();

		if (this.errors) {
			return false;
		}

		// FIXME! This must go into the caller!
		this.catalog.makePOT();

		return true;
	}

	private extractCharset(header: string): string {
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
				gtx._x('the charset "{charset}" is not a portable encoding name.', {
					charset,
				}),
				this.loc,
			);
			this.warn(
				gtx._('message conversion to the users charset might not work.'),
				this.loc,
			);
			return null;
		}

		return charset;
	}

	private flushEntry(): void {
		if (this.errors) {
			this.entry = undefined;
			return;
		}

		if (this.entry) {
			const msgctxt = this.entry.properties.msgctxt;
			const msgid = this.entry.properties.msgid;
			if (typeof msgid === 'undefined') {
				// TRANSLATORS: Do not translate "msgid".
				this.error(gtx._('missing "msgid" section'), this.loc);
				return;
			}
			if (this.seen[msgctxt] && this.seen[msgctxt][msgid]) {
				this.error(gtx._('duplicate message definition...'), this.entryLoc);
				this.error(
					gtx._('...this is the location of the first definition'),
					this.seen[msgctxt][msgid],
				);
				return;
			}
			if (!this.seen[msgctxt]) {
				this.seen[msgctxt] = {};
			}

			this.seen[msgctxt][msgid] = this.copyLocation(this.entryLoc);
			this.catalog.addEntry(this.entry);
		}
		this.entry = undefined;
	}

	private parseCommentLine(line: string): void {
		const marker = line[1];
		switch (marker) {
			case ',':
				this.parseFlags(line);
				break;

			case ':':
				this.parseReferences(line);
				break;

			case '.':
				this.entry.addExtractedCommentLine(line.substr(1).trim());
				break;

			case ' ':
				this.entry.addTranslatorCommentLine(line.substr(2));
				break;

			default:
				this.entry.addTranslatorCommentLine(line.substr(1));
				break;
		}
	}

	private parseKeywordLine(line: string): void {
		const errorsBefore = this.errors;

		let remainder = line.replace(/^[_A-Za-z0-9[\]]+/, keyword => {
			switch (keyword) {
				case 'msgid':
					this.entryLoc = this.copyLocation(this.loc);
					this.msgType = keyword;
					if (typeof this.entry.properties.msgid !== 'undefined') {
						this.error(
							gtx._x('duplicate "{keyword}" section', { keyword }),
							this.loc,
						);
					}
					break;
				case 'msgstr':
					this.msgType = keyword;
					if (typeof this.entry.properties.msgstr !== 'undefined') {
						this.error(
							gtx._x('duplicate "{keyword}" section', { keyword }),
							this.loc,
						);
					}
					break;
				case 'msgid_plural':
					this.msgType = keyword;
					if (typeof this.entry.properties.msgidPlural !== 'undefined') {
						this.error(
							gtx._x('duplicate "{keyword}" section', { keyword }),
							this.loc,
						);
					}
					break;
				case 'msgctxt':
					this.msgType = keyword;
					if (typeof this.entry.properties.msgctxt !== 'undefined') {
						this.error(
							gtx._x('duplicate "{keyword}" section', { keyword }),
							this.loc,
						);
					}
					break;
				default:
					if (!/^msgstr\[[0-9]+\]/.exec(keyword)) {
						this.error(
							gtx._x('keyword "{keyword}" unknown', { keyword }),
							this.loc,
						);
					}
					this.msgType = keyword;
			}

			this.loc.start.column += keyword.length;

			return '';
		});

		if (errorsBefore !== this.errors) {
			return;
		}

		remainder = this.trim(remainder);
		if (remainder.startsWith('"')) {
			return this.parseQuotedString(remainder);
		} else {
			this.syntaxError();
		}
	}

	private parseQuotedString(line: string): void {
		if (!line.endsWith('"')) {
			this.loc.start.column += line.length;
			this.error(gtx._('end-of-line within string'), this.loc);
			return;
		}

		const raw = line.substr(1, line.length - 2);
		if (raw.length && raw.endsWith('\\')) {
			this.error(gtx._('end-of-line within string'), this.loc);
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
					this.loc.start.column += offset + 1;
					this.error(gtx._('invalid control sequence'), this.loc);
					retval = '';
			}

			return retval;
		});

		if (this.errors) {
			return;
		}

		switch (this.msgType) {
			case 'msgid':
				this.entry.addToMsgid(msg);
				break;
			case 'msgstr':
				this.entry.addToMsgstr(msg);
				break;
			case 'msgid_plural':
				this.entry.addToMsgidPlural(msg);
				break;
			case 'msgctxt':
				this.entry.addToMsgctxt(msg);
				break;
			default:
				// Ignore plural translations.
				break;
		}
	}

	private parseFlags(line: string): void {
		const flags = line.substr(2).split(',');
		flags.forEach((flag, i) => {
			if (i) {
				++this.loc.start.column;
			}

			const rspace = this.rspace(flag);
			flag = this.trim(flag);
			if (!flag.length) {
				this.warn(gtx._('ignoring empty flag'), this.loc);
			} else {
				this.entry.addFlag(flag);
			}
			this.loc.start.column += rspace + flag.length;
		});
	}

	private parseReferences(line: string): void {
		this.loc.start.column += 2;

		const refs = line.substr(2).split(' ');
		refs.forEach((reference, i) => {
			if (i) {
				++this.loc.start.column;
			}

			reference = this.trim(reference);

			if (/.+:[1-9][0-9]*$/.exec(reference)) {
				this.entry.addReference(reference);
			} else if (reference !== '') {
				this.warn(
					gtx._x('ignoring mal-formed reference "{reference}"', {
						reference,
					}),
					this.loc,
				);
			}
			this.loc.start.column += reference.length;
		});
	}

	private syntaxError(): void {
		this.error(gtx._('syntax error'), this.loc);
	}

	private trim(str: string): string {
		return str
			.replace(/^[\s\uFEFF\xA0]+/, match => {
				this.loc.start.column += match.length;
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
			end: null,
		} as SourceLocation;
	}
}
