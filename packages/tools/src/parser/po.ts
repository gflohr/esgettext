import { Textdomain } from '@esgettext/runtime';
import { Catalog } from '../pot/catalog';
import { POTEntry } from '../pot/entry';

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

export class PoParser {
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

	constructor(private readonly warner: (msg: string) => void) {}

	/**
	 * Parse a po file into a catalog. This parser is very forgiving and
	 * accepts input that actually does not follow the standard in certain
	 * areas.
	 *
	 * @param input - the content of the po file
	 * @param filename - the filename
	 */
	parse(input: string, filename: string): Catalog {
		// Reset parser.
		this.catalog = new Catalog();
		this.catalog.deleteEntry('');
		this.entry = undefined;
		this.filename = filename;
		this.lineno = 0;
		this.column = 1;
		this.msgType = null;
		this.seen = {};

		input.split('\n').forEach((line) => {
			this.column = 1;
			++this.lineno;
			if (line === '') {
				this.flushEntry();
			} else {
				const first = line[0];
				switch (first) {
					case '#':
						if (line.length > 1 && line[1] === '~') {
							if (this.entry) {
								++this.column;
								this.syntaxError();
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
		});

		this.flushEntry();

		return this.catalog;
	}

	private flushEntry(): void {
		if (this.entry) {
			const msgctxt = this.entry.properties.msgctxt;
			const msgid = this.entry.properties.msgid;
			if (typeof this.entry.properties.msgid === 'undefined') {
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

			case ' ':
				this.entry.addTranslatorCommentLine(line.substr(2));
				break;

			default:
				this.entry.addTranslatorCommentLine(line.substr(1));
				break;
		}
	}

	private parseKeywordLine(line: string): void {
		let remainder = line.replace(/^[A-Za-z0-9[\]]+/, (keyword) => {
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

			return '';
		});
		if (remainder === line) {
			this.syntaxError();
		}

		remainder = this.trim(remainder.trim());
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
			this.error(gtx._('end-of-line withing string'));
		}
		const msg = raw.replace(/\\./g, (match) => {
			switch (match[1]) {
				case '\\':
				case '"':
					return match[1];
				case 'a':
					return '\u0007';
				case 'b':
					return '\b';
				case 't':
					return '\t';
				case 'n':
					return '\n';
				case 'v':
					return '\v';
				case 'r':
					return '\r';
				default:
					this.error(gtx._('invalid control sequence'));
					return 'not reached';
			}
		});

		if (this.msgType) {
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
	}

	private parseFlags(line: string): void {
		const flags = line.split(',');
		flags.forEach((flag, i) => {
			if (i) {
				++this.column;
			}

			const rspace = this.rspace(flag);
			flag = this.trim(flag);
			if (flag.includes(',')) {
				this.warn(
					gtx._x('ignoring flag "{flag}" because it contains a comma', {
						flag,
					}),
				);
			} else if (!flag.length) {
				this.warn(gtx._('ignoring empty flag'));
			} else {
				this.entry.addFlag(flag);
			}
			this.column += rspace + flag.length;
		});
	}

	private parseReferences(line: string): void {
		const refs = line.split(' ');
		refs.forEach((reference, i) => {
			if (i) {
				++this.column;
			}

			const rspace = this.rspace(reference);
			reference = this.trim(reference);

			if (reference.includes(' ')) {
				this.warn(
					gtx._x(
						'ignoring reference "{reference}" because it contains a space',
						{
							reference,
						},
					),
				);
			} else if (/.+:[1-9][0-9]*$/.exec(reference)) {
				this.entry.addReference(reference);
			} else {
				this.warn(
					gtx._x('ignoring mal-formed reference "{reference}".', {
						reference,
					}),
				);
			}
			this.column += rspace + reference.length;
		});
	}

	private warn(msg: string): void {
		this.warner(`${this.filename}:${this.lineno}:${this.column} ${msg}`);
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
