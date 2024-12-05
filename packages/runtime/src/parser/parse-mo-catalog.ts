import { Catalog } from '../core/catalog';
import { germanicPlural } from '../core/germanic-plural';
import { DataViewlet } from '../core/data-viewlet';

interface POHeader {
	[key: string]: string;
}

/*
 * Parse an MO file.
 *
 * An exception is thrown for invalid data.
 *
 * @param raw - The input as either a binary `String`, any `Array`-like byte
 *              storage (`Array`, `Uint8Array`, `Arguments`, `jQuery(Array)`, ...)
 * @returns a Catalog
 */
export function parseMoCatalog(raw: ArrayBuffer): Catalog {
	const catalog: Catalog = {
		major: 0,
		minor: 0,
		entries: {},
		pluralFunction: germanicPlural,
	};
	let offset = 0;

	const blob = new DataViewlet(new Uint8Array(raw), 'ascii');

	const magic = blob.readUInt32LE(offset);

	type Reader = (buf: DataViewlet, off: number) => number;
	let reader: Reader;
	if (magic === 0x950412de) {
		reader = (buf, off) => buf.readUInt32LE(off);
	} else if (magic === 0xde120495) {
		reader = (buf, off) => buf.readUInt32BE(off);
	} else {
		throw new Error(`invalid MO magic 0x${magic.toString(16)}`);
	}

	offset += 4;

	// The revision is encoded in two shorts, major and minor.  We don't care
	// about the minor revision.
	const major = reader(blob, offset) >> 16;
	offset += 4;
	if (major > 0) {
		throw new Error(`unsupported major revision ${major}`);
	}
	const numStrings = reader(blob, offset);
	offset += 4;
	const msgidOffset = reader(blob, offset);
	offset += 4;
	const msgstrOffset = reader(blob, offset);

	offset = msgidOffset;
	const origTab = [];
	for (let i = 0; i < numStrings; ++i) {
		const l = reader(blob, offset);
		offset += 4;
		const stringOffset = reader(blob, offset);
		offset += 4;
		origTab.push([l, stringOffset]);
	}

	offset = msgstrOffset;
	const transTab = [];
	for (let i = 0; i < numStrings; ++i) {
		const l = reader(blob, offset);
		offset += 4;
		const stringOffset = reader(blob, offset);
		offset += 4;
		transTab.push([l, stringOffset]);
	}

	const poHeader: POHeader = {};
	for (let i = 0; i < numStrings; ++i) {
		const orig = origTab[i];
		let l = orig[0];
		offset = orig[1];

		const msgid = blob.readString(offset, l).split('\u0000')[0];

		const trans = transTab[i];
		l = trans[0];
		offset = trans[1];

		const msgstr = blob.readString(offset, l).split('\u0000');

		let pairs, kv;
		if (i === 0 && msgid === '') {
			pairs = msgstr[0].split('\n');
			for (let j = 0; j < pairs.length; ++j) {
				if (pairs[j] !== '') {
					kv = pairs[j].split(/[ \t]*:[ \t]*/);
					poHeader[kv[0].toLowerCase()] = kv[1];
				}
			}

			if (poHeader['content-type'] !== undefined) {
				const enc = poHeader['content-type'].replace(/.*=/, '');
				if (enc !== poHeader['content-type']) {
					blob.encoding = enc;
				}
			}
		}

		catalog.entries[msgid] = msgstr;
	}

	return catalog;
}
