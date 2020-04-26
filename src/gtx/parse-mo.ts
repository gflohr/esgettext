import jDataView from 'jdataview';
import { Catalog } from './catalog';

/* eslint-disable @typescript-eslint/no-explicit-any */

function germanicPlural(num: number): number {
	return num === 1 ? 0 : 1;
}

function doParseMO(raw: any): Catalog {
	const catalog = {
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
		return null; // Data corrupted.
	}

	return catalog;
}

/**
 * Parse an MO file.
 *
 * See
 * @param raw The input as either a binary `String`, any `Array`-like byte
 *            storage (`Array`, `Uint8Array`, `Arguments`, `jQuery(Array)`, ...)
 * @return a `Catalog`
 */
export function parseMO(raw: any): Catalog | null {
	try {
		return doParseMO(raw);
	} catch (e) {
		return null;
	}
}
