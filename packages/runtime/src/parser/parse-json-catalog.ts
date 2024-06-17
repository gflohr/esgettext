import { Catalog } from '../core/catalog';

export function validateJsonCatalog(udata: unknown): Catalog {
	// We could use ajv but it results in almost 300 k minimized code
	// for the browser bundle. This validator instead is absolutely
	// minimalistic, and only avoids exceptions that can occur, when
	// accessing entries.

	if (udata === null || typeof udata === 'undefined') {
		throw new Error('catalog is either null or undefined');
	}

	const entries = udata;
	if (entries.constructor !== Object) {
		new Error('catalog must be a dictionary');
	}

	// Convert to a regular catalog.
	const catalog: Catalog = {
		major: 0,
		minor: 1,
		pluralFunction: () => 0,
		entries: {},
	};

	for (const [msgid, msgstr] of Object.entries(entries)) {
		// Just stringify all values but do not complain.
		catalog.entries[msgid] = [msgstr.toString()];
	}

	return catalog;
}

export function parseJsonCatalog(json: ArrayBuffer): Catalog {
	const text = new TextDecoder().decode(json);
	const data = JSON.parse(text) as unknown;

	return validateJsonCatalog(data);
}
