import { decode, encodingExists } from 'iconv-lite';
import { Textdomain } from '@esgettext/runtime';
import { Catalog } from '../pot/catalog';
import { POTEntry } from '../pot/entry';
import { Parser } from './parser';

const gtx = Textdomain.getInstance('esgettext-tools');

interface Escapes {
	'\\': string;
	'"': string;
	a: string;
	b: string;
	t: string;
	n: string;
	v: string;
	r: string;
}

export class PoParser extends Parser {
	private catalog: Catalog;
	private entry: POTEntry;
	private entryLineno: number;
	private filename: string;
	private lineno: number;
	private column: number;
	private msgType: string = null;
	private seen: {
		[key: string]: {
			[key: string]: number;
		};
	};

	constructor(private readonly warner: (msg: string) => void) {
		super();
	}

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
	parse(buf: Buffer, filename: string, encoding?: string): Catalog {
		if (typeof encoding !== 'undefined') {
			if (!encodingExists(encoding)) {
				throw new Error(
					gtx._x('unsupported encoding "{encoding}"', { encoding }),
				);
			}
		}

		const input =
			typeof encoding === 'undefined' ? buf.toString() : decode(buf, encoding);

		// Reset parser.
		this.catalog = new Catalog({ fromCode: encoding, noHeader: true });
		this.entry = undefined;
		this.filename = filename;
		this.lineno = 0;
		this.column = 1;
		this.msgType = null;
		this.seen = {};

		// We cannot use forEach here because we may have to return from
		// inside the loop.
		const lines = input.split('\n');
		for (let i = 0; i < lines.length; ++i) {
			const line = lines[i];
			this.column = 1;
			++this.lineno;
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
								this.error(gtx._('inconsistent use of #~'));
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
				return this.parse(buf, filename, charset);
			}
		}

		this.flushEntry();
		this.catalog.makePOT();

		return this.catalog;
	}

	private extractCharset(header: string): string {
		const headers: { [key: string]: string } = {};

		header
			.split('\n')
			.map((line) => line.split(':'))
			.map((chunks) => ({
				name: chunks[0].toLowerCase(),
				value: chunks.slice(1).join(':').trim(),
			}))
			.filter((header) => header.name !== '')
			.forEach((header) => (headers[header.name] = header.value));

		const contentType = headers['content-type'];
		if (typeof contentType === 'undefined') {
			return null;
		}

		const tokens = contentType.split('=').map((token) => token.trim());
		if (tokens.length <= 1) {
			return null;
		}

		const charset = tokens[tokens.length - 1];

		if (!encodingExists(charset)) {
			this.warn(
				gtx._x('The charset "{charset}" is not a portable encoding name.', {
					charset,
				}),
			);
			this.warn(
				gtx._('Message conversion to the users charset might not work.'),
			);
			return null;
		}

		return charset;
	}

	private flushEntry(): void {
		if (this.entry) {
			const msgctxt = this.entry.properties.msgctxt;
			const msgid = this.entry.properties.msgid;
			if (typeof msgid === 'undefined') {
				// TRANSLATORS: Do not translate "msgid".
				this.error(gtx._('missing "msgid" section'));
			}
			if (this.seen[msgctxt] && this.seen[msgctxt][msgid]) {
				const location = this.seen[msgctxt][msgid];
				this.warner(
					`${this.filename}:${this.entryLineno}: ` +
						gtx._('duplicate message definition...'),
				);
				this.warner(
					`${this.filename}:${location}: ` +
						gtx._('...this is the location of the first definition'),
				);
				this.error(gtx._('cannot proceed after fatal error'));
			}
			if (!this.seen[msgctxt]) {
				this.seen[msgctxt] = {};
			}
			this.seen[msgctxt][msgid] = this.entryLineno;
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
		let remainder = line.replace(/^[_A-Za-z0-9[\]]+/, (keyword) => {
			switch (keyword) {
				case 'msgid':
					this.entryLineno = this.lineno;
					this.msgType = keyword;
					if (typeof this.entry.properties.msgid !== 'undefined') {
						this.error(gtx._x('duplicate "{keyword}" section', { keyword }));
					}
					break;
				case 'msgstr':
					this.msgType = keyword;
					if (typeof this.entry.properties.msgstr !== 'undefined') {
						this.error(gtx._x('duplicate "{keyword}" section', { keyword }));
					}
					break;
				case 'msgid_plural':
					this.msgType = keyword;
					if (typeof this.entry.properties.msgidPlural !== 'undefined') {
						this.error(gtx._x('duplicate "{keyword}" section', { keyword }));
					}
					break;
				case 'msgctxt':
					this.msgType = keyword;
					if (typeof this.entry.properties.msgctxt !== 'undefined') {
						this.error(gtx._x('duplicate "{keyword}" section', { keyword }));
					}
					break;
				default:
					if (!/^msgstr\[[0-9]+\]/.exec(keyword)) {
						this.error(gtx._x('keyword "{keyword}" unknown', { keyword }));
					}
					this.msgType = keyword;
			}

			this.column += keyword.length;

			return '';
		});

		remainder = this.trim(remainder);
		if (remainder.startsWith('"')) {
			return this.parseQuotedString(remainder);
		} else {
			this.syntaxError();
		}
	}

	private parseQuotedString(line: string): void {
		if (!line.endsWith('"')) {
			this.error(gtx._('end-of-line within string'));
		}

		const raw = line.substr(1, line.length - 2);
		if (raw.length && raw.endsWith('\\')) {
			this.error(gtx._('end-of-line within string'));
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
					this.column += offset + 1;
					this.error(gtx._('invalid control sequence'));
			}

			return retval;
		});

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
				++this.column;
			}

			const rspace = this.rspace(flag);
			flag = this.trim(flag);
			if (!flag.length) {
				this.warn(gtx._('ignoring empty flag'));
			} else {
				this.entry.addFlag(flag);
			}
			this.column += rspace + flag.length;
		});
	}

	private parseReferences(line: string): void {
		this.column += 2;

		const refs = line.substr(2).split(' ');
		refs.forEach((reference, i) => {
			if (i) {
				++this.column;
			}

			reference = this.trim(reference);

			if (/.+:[1-9][0-9]*$/.exec(reference)) {
				this.entry.addReference(reference);
			} else if (reference !== '') {
				this.warn(
					gtx._x('ignoring mal-formed reference "{reference}"', {
						reference,
					}),
				);
			}
			this.column += reference.length;
		});
	}

	private warn(msg: string): void {
		this.warner(`${this.filename}:${this.lineno}:${this.column}: ${msg}`);
	}

	private syntaxError(): void {
		this.error(gtx._('syntax error'));
	}

	private error(msg: string): void {
		throw new Error(`${this.filename}:${this.lineno}:${this.column}: ${msg}`);
	}

	private trim(str: string): string {
		return str
			.replace(/^[\s\uFEFF\xA0]+/, (match) => {
				this.column += match.length;
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
}
