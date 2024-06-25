import { PoEntry } from './po-entry';

// FIXME! We don't a cache here!
interface Cache {
	// msgid
	[key: string]: {
		// msgctxt
		[key: string]: PoEntry;
	};
}

export type TranslationCatalogueProperties = {
	package?: string;
	version?: string;
	copyrightHolder?: string;
	msgidBugsAddress?: string;
	foreignUser?: boolean;
	date?: string;
};

export type RenderOptions = {
	width?: number;
	sortOutput?: boolean;
	sortByFile?: boolean;
	omitHeader?: boolean;
};

export type POHeader = {
	ProjectIdVersion: string;
	ReportMsgidBugsTo: string;
	POTCreationDate: string;
	PORevisionDate: string;
	LastTraslator: string;
	LanguageTeam: string;
	Language: string;
	MIMEVersion: string;
	ContentType: string;
	ContentTransferEncoding: string;
	PluralForms: string;
	[field: string]: string,
};

/**
 * An entire message catalog that is subsequently filled.
 */
export class TranslationCatalogue {
	private readonly cache: Cache = {};
	entries: Array<PoEntry>;

	constructor(readonly properties: TranslationCatalogueProperties = {}) {
		this.entries = new Array<PoEntry>();
		let barePkg: string;

		if (typeof properties.package === 'undefined') {
			barePkg = 'PACKAGE';
			properties.package = 'PACKAGE VERSION';
		} else {
			barePkg = properties.package.replace(/\n/g, '\\n');
			if (typeof properties.version !== 'undefined') {
				properties.package += ' ' + properties.version;
			}
		}

		if (typeof properties.copyrightHolder === 'undefined') {
			properties.copyrightHolder = "THE PACKAGE'S COPYRIGHT HOLDER";
		}

		if (typeof properties.msgidBugsAddress === 'undefined') {
			properties.msgidBugsAddress = 'MSGID_BUGS_ADDRESS';
		}

		if (typeof properties.date === 'undefined') {
			const now = new Date();

			// Avoid if/else, so we do not spoil our test coverage. :)
			let year = now.getFullYear().toString();
			year = '0'.repeat(4 - year.length) + year;
			let month = (1 + now.getMonth()).toString();
			month = '0'.repeat(2 - month.length) + month;
			let mday = now.getDate().toString();
			mday = '0'.repeat(2 - mday.length) + mday;
			let hour = now.getHours().toString();
			hour = '0'.repeat(2 - hour.length) + hour;
			let minutes = now.getMinutes().toString();
			minutes = '0'.repeat(2 - minutes.length) + minutes;

			// Do not depend on the timezone for test coverage.
			let offset = now.getTimezoneOffset();
			const sign = ['+', '-'][Math.sign(offset) + 1];
			offset = Math.abs(offset);

			let offsetHours = Math.floor(offset / 60).toString();
			offsetHours = '0'.repeat(2 - offsetHours.length) + offsetHours;
			let offsetMinutes = (offset % 60).toString();
			offsetMinutes = '0'.repeat(2 - offsetMinutes.length) + offsetMinutes;

			properties.date =
				[year, month, mday].join('-') +
				` ${hour}:${minutes}` +
				`${sign}${offsetHours}${offsetMinutes}`;
		}

		const pkg = properties.package.replace(/\n/g, '\\n');
		const msgidBugsAddress = properties.msgidBugsAddress.replace(/\n/g, '\\n');
		const copyrightHolder = properties.copyrightHolder.replace(/\n/g, '\\n');

		const header = `Project-Id-Version: ${pkg}
Report-Msgid-Bugs-To: ${msgidBugsAddress}
POT-Creation-Date: ${properties.date}
PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE
Last-Translator: FULL NAME <EMAIL@ADDRESS>
Language-Team: LANGUAGE <LL@li.org>
Language:\u0020
MIME-Version: 1.0
Content-Type: text/plain; charset=CHARSET
Content-Transfer-Encoding: 8bit
`;

		let comment;
		if (properties.foreignUser) {
			comment = `SOME DESCRIPTIVE TITLE
This file is put in the public domain.
FIRST AUTHOR <EMAIL@ADDRESS>, YEAR.
`;
		} else {
			comment = `SOME DESCRIPTIVE TITLE
Copyright (C) YEAR ${copyrightHolder}
This file is distributed under the same license as the ${barePkg} package.
FIRST AUTHOR <EMAIL@ADDRESS>, YEAR.
`;
		}

		const headerEntry = new PoEntry({
			msgid: '',
			msgstr: [header],
			flags: ['fuzzy'],
			translatorComments: [comment],
			noWarnings: true,
		});
		this.addEntry(headerEntry);
	}

	/**
	 * Render the entire catalog as a PO file.
	 *
	 * @param renderOptions - options for rendering
	 *
	 * The following options are supported:
	 *
	 * width: wrap lines to that page width (default: 76)
	 *
	 * @returns the catalog rendered as a po(t) file
	 */
	renderPo(options: RenderOptions = {}): string {
		const width =
			options && typeof options.width !== 'undefined' ? options.width : 76;

		const isNotHeader = (entry: PoEntry): boolean => {
			return !(
				entry.properties.msgid === '' &&
				typeof entry.properties.msgctxt === 'undefined'
			);
		};
		const isHeader = (entry: PoEntry): boolean => {
			return !isNotHeader(entry);
		};

		const header = options.omitHeader
			? undefined
			: this.entries
					.filter(isHeader)
					.map(entry => entry.toString(width))
					.join('\n');

		let body = '';
		if (options.sortOutput) {
			body = this.entries
				.filter(isNotHeader)
				.sort((a, b) => {
					const cmp = a.properties.msgid.localeCompare(b.properties.msgid);
					if (cmp) {
						return cmp;
					}
					const actx = a.properties.msgctxt;
					const bctx = b.properties.msgctxt;

					// It is impossible that both msgctxts are undefined
					// because that would mean that the msgids are identical
					// which is prevented.
					if (typeof bctx === 'undefined') {
						return +1;
					} else if (typeof actx === 'undefined') {
						return -1;
					}

					return actx.localeCompare(bctx);
				})
				.map(entry => entry.toString(width))
				.join('\n');
		} else if (options.sortByFile) {
			const copy = this.copy(this.properties);

			const splitRef = (ref: string): { filename: string; lineno: number } => {
				const parts = ref.split(':');
				const lineno = Number.parseInt(parts.pop() as string, 10);
				const filename = parts.join(':');
				return { filename, lineno };
			};

			// First order all references
			copy.entries.forEach(entry => {
				if (entry.properties.references) {
					entry.properties.references = entry.properties.references
						.map(splitRef)
						.sort((a, b) => {
							return (
								a.filename.localeCompare(b.filename) ||
								Math.sign(a.lineno - b.lineno)
							);
						})
						.map(ref => `${ref.filename}:${ref.lineno}`);
				}
			});

			const compareSplitRefs = (
				a: {
					refs: Array<{ filename: string; lineno: number }>;
					entry: PoEntry;
				},
				b: {
					refs: Array<{ filename: string; lineno: number }>;
					entry: PoEntry;
				},
			): number => {
				const arefs = a.refs;
				const brefs = b.refs;
				const min = Math.min(arefs.length, brefs.length);
				for (let i = 0; i < min; ++i) {
					const cmp =
						arefs[i].filename.localeCompare(brefs[i].filename) ||
						Math.sign(arefs[i].lineno - brefs[i].lineno);
					if (cmp) {
						return cmp;
					}
				}
				return Math.sign(arefs.length - brefs.length);
			};

			const splitRefs = (
				refs: Array<string>,
			): Array<{ filename: string; lineno: number }> => {
				return refs ? refs.map(splitRef) : [];
			};

			body = copy.entries
				.filter(isNotHeader)
				.map(entry => {
					return {
						refs: splitRefs(entry.properties.references as string[]),
						entry,
					};
				})
				.sort(compareSplitRefs)
				.map(split => split.entry)
				.map(entry => entry.toString(width))
				.join('\n');
		} else {
			body = this.entries
				.filter(isNotHeader)
				.map(entry => entry.toString(width))
				.join('\n');
		}

		if (body && header) {
			return `${header}\n${body}`;
		} else {
			return header || body || '';
		}
	}

	/**
	 * Add an entry to the catalog. If an entry with the same msgid
	 * and msgctxt already exists, the entry is merged into
	 * the existing one instead.
	 *
	 * @param entry - the `PoEntry` to add
	 */
	addEntry(entry: PoEntry): void {
		const msgid = entry.properties.msgid;
		const msgctxt = entry.properties.msgctxt as string;

		if (!Object.prototype.hasOwnProperty.call(this.cache, msgid)) {
			this.cache[msgid] = {};
		}
		if (!Object.prototype.hasOwnProperty.call(this.cache[msgid], msgctxt)) {
			this.cache[msgid][msgctxt] = entry;
			this.entries.push(entry);
		} else {
			this.cache[msgid][msgctxt].merge(entry);
		}
	}

	/**
	 * Remove an entry from the catalog.
	 *
	 * @param msgid - the message id
	 * @param msgctxt - the message context
 	 */
	deleteEntry(msgid: string, msgctxt?: string) {
		if (!this.cache[msgid]) {
			return;
		}

		const entry = this.cache[msgid][msgctxt as string];
		if (!entry) {
			return;
		}

		delete this.cache[msgid][msgctxt as string];
		this.entries = this.entries.filter(other => other !== entry);
	}
	/**
	 * Add an entry to the catalog. If an entry with the same msgid
	 * and msgctxt already exists, the entry is merged into
	 * the existing one instead.
	 *
	 * @param entry - the `PoEntry` to add
	 */
	getEntry(msgid: string, msgctxt?: string): PoEntry | undefined {
		return this.entries.find(entry => {
			return entry.properties.msgid === msgid
				&& entry.properties.msgctxt === msgctxt
		});
	}


	/**
	 * Copy a catalogue with other options. This is for testing only.
	 *
	 * @returns a deep copy of the catalogue.
	 */
	copy(properties?: TranslationCatalogueProperties): TranslationCatalogue {
		const other = new TranslationCatalogue(properties);

		this.entries.forEach(entry => other.addEntry(entry));

		return other;
	}

	/**
	 * Removes all translations from a catalog, so that it can be used as
	 * a .pot file.
	 */
	makePOT(): void {
		this.entries.forEach(entry => {
			if (
				!(
					entry.properties.msgid === '' &&
					typeof entry.properties.msgctxt === 'undefined'
				)
			) {
				delete entry.properties.msgstr;
			}
		});
	}
}
