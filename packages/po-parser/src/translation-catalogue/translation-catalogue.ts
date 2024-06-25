import { PoEntry } from './po-entry';

// FIXME! We don't a cache here!
interface Cache {
	// msgid
	[key: string]: {
		// msgctxt
		[key: string]: PoEntry;
	};
}

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
	[field: string]: string;
};

/**
 * An entire message catalog that is subsequently filled.
 */
export class TranslationCatalogue {
	private readonly cache: Cache = {};
	entries: Array<PoEntry>;

	constructor() {
		this.entries = new Array<PoEntry>();
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
			const copy = this.copy();

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
			return (
				entry.properties.msgid === msgid && entry.properties.msgctxt === msgctxt
			);
		});
	}

	/**
	 * Copy a catalogue.
	 *
	 * @returns a deep copy of the catalogue.
	 */
	copy(): TranslationCatalogue {
		const other = new TranslationCatalogue();

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
