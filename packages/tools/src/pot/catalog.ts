import { POTEntry } from './entry';

interface Cache {
	// msgid
	[key: string]: {
		// msgidPlurl
		[key: string]: {
			// msgctxt
			[key: string]: POTEntry;
		};
	};
}

interface CatalogProperties {
	package?: string;
	version?: string;
	msgidBugsAddress?: string;
	foreignUser?: boolean;
	date?: string;
	fromCode?: string;
}

interface RenderOptions {
	width?: number;
}

/**
 * An entire message catalog that is subsequently filled.
 */
export class Catalog {
	private readonly cache: Cache = {};
	private readonly entries: Array<POTEntry>;

	constructor(private readonly properties?: CatalogProperties) {
		if (typeof properties === 'undefined') {
			properties = {};
		}
		if (typeof properties.package === 'undefined') {
			properties.package = 'PACKAGE';
		}
		if (typeof properties.version === 'undefined') {
			properties.version = 'VERSION';
		}
		if (typeof properties.msgidBugsAddress === 'undefined') {
			properties.msgidBugsAddress = 'MSGID_BUGS_ADDRESS';
		}
		// GNU xgettext does not set the charset in the PO header but we do.
		if (typeof properties.fromCode === 'undefined') {
			properties.fromCode = 'CHARSET';
		}
		if (typeof properties.date === 'undefined') {
			const now = new Date();

			// Avoid if/else, so we do not spoil our test coverage. :)
			let year = now.getFullYear().toString();
			year = '0'.repeat(4 - year.length) + year;
			let month = now.getMonth().toString();
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
		const version = properties.version.replace(/\n/g, '\\n');
		const msgidBugsAddress = properties.msgidBugsAddress.replace(/\n/g, '\\n');

		const header = `Project-Id-Version: ${pkg} ${version}
Report-Msgid-Bugs-To: ${msgidBugsAddress}
POT-Creation-Date: ${properties.date}
PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE
Last-Translator: FULL NAME <EMAIL@ADDRESS>
Language-Team: LANGUAGE <LL@li.org>
Language:
MIME-Version: 1.0
Content-Type: text/plain; charset=${properties.fromCode}
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
Copyright (C) YEAR THE PACKAGE'S COPYRIGHT HOLDER
This file is distributed under the same license as the PACKAGE package.
FIRST AUTHOR <EMAIL@ADDRESS>, YEAR.
`;
		}

		this.entries = new Array<POTEntry>();
		const headerEntry = new POTEntry({
			msgid: '',
			msgstr: header,
			flags: ['fuzzy'],
			translatorComments: [comment],
		});
		this.addEntry(headerEntry);
	}

	/**
	 * Render the entire catalog.
	 *
	 * @param renderOptions = options for rendering
	 *
	 * The following options are supported:
	 *
	 * width: wrap lines to that page width (default: 76)
	 *
	 * @returns the catalog rendered as a po(t) file
	 */
	toString(options?: RenderOptions) {
		const width =
			options && typeof options.width !== 'undefined' ? options.width : 76;
		return this.entries.map((entry) => entry.toString(width)).join('\n');
	}

	/**
	 * Add an entry to the catalog. If an entry with the same msgid,
	 * msgidPlural, and msgctxt already exists, the entry is merged into
	 * the existing one instead.
	 *
	 * @param entry - the `POTEntry` to add
	 */
	addEntry(entry: POTEntry): void {
		const msgid =
			typeof entry.properties.msgid !== 'undefined'
				? entry.properties.msgid
				: '';
		const msgidPlural =
			typeof entry.properties.msgidPlural !== 'undefined'
				? entry.properties.msgidPlural
				: '';
		const msgctxt =
			typeof entry.properties.msgctxt !== 'undefined'
				? entry.properties.msgidPlural
				: '';

		if (!Object.prototype.hasOwnProperty.call(this.cache, msgid)) {
			this.cache[msgid] = {};
		}
		if (!Object.prototype.hasOwnProperty.call(this.cache[msgid], msgidPlural)) {
			this.cache[msgid][msgidPlural] = {};
		}
		if (
			!Object.prototype.hasOwnProperty.call(
				this.cache[msgid][msgidPlural],
				msgctxt,
			)
		) {
			this.cache[msgid][msgidPlural][msgctxt] = entry;
			this.entries.push(entry);
		} else {
			this.cache[msgid][msgidPlural][msgctxt].merge(entry);
		}
	}
}
