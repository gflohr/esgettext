import jDataView from 'jdataview';
import { Catalog } from '../gtx/catalog';
import { germanicPlural } from '../gtx/germanic-plural';

/* eslint-disable @typescript-eslint/no-explicit-any, no-control-regex, no-bitwise */

interface POHeader {
	[key: string]: string;
}

/**
 * Parse an MO file.
 *
 * An exception is thrown for invalid data.
 *
 * @param raw The input as either a binary `String`, any `Array`-like byte
 *            storage (`Array`, `Uint8Array`, `Arguments`, `jQuery(Array)`, ...)
 * @return a `Catalog`
 */
export function parseMoCatalog(raw: any): Catalog {
	const catalog: Catalog = {
		major: 0,
		minor: 0,
		entries: {},
		pluralFunction: germanicPlural,
	};

	let blob = new jDataView(raw, 0, raw.length, false);
	const magic = blob.getUint32();

	if (magic === 0xde120495) {
		blob = new jDataView(raw, 0, raw.length, true);
	} else if (magic !== 0x950412de) {
		throw new Error('mo file corrupted');
	}

	blob.skip(4);

	// The revision is encoded in two shorts, major and minor.  We don't care
	// about the minor revision.
	const major = blob.getUint32() >> 16;
	if (major > 0) {
		throw new Error(`unsupported major revision ${major}`);
	}
	const numStrings = blob.getUint32();
	const msgidOffset = blob.getUint32();
	const msgstrOffset = blob.getUint32();

	blob.seek(msgidOffset);
	const origTab = [];
	for (let i = 0; i < numStrings; ++i) {
		const l = blob.getUint32();
		const offset = blob.getUint32();
		origTab.push([l, offset]);
	}

	blob.seek(msgstrOffset);
	const transTab = [];
	for (let i = 0; i < numStrings; ++i) {
		const l = blob.getUint32();
		const offset = blob.getUint32();
		transTab.push([l, offset]);
	}

	const poHeader: POHeader = {};
	let encoding = 'binary';
	for (let i = 0; i < numStrings; ++i) {
		const orig = origTab[i];
		let l = orig[0];
		let offset = orig[1];

		blob.seek(offset);
		const msgid = blob
			.getString(l, undefined, encoding)
			.replace(/\u0000.*/, '');

		const trans = transTab[i];
		l = trans[0];
		offset = trans[1];

		blob.seek(offset);
		const msgstr = blob.getString(l, undefined, encoding).split('\u0000');

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
					poHeader.charset = encoding = enc;
				}
			}
		}

		catalog.entries[msgid] = msgstr;
	}

	return catalog;
}
