import { Catalog } from '../core/catalog';

export function validateJsonCatalog(udata: unknown): Catalog {
	// We could use ajv but it results in almost 300 k minimized code
	// for the browser bundle. This validator instead is absolutely
	// minimalistic, and only avoids exceptions that can occur, when
	// accessing entries.

	if (udata === null || typeof udata === 'undefined') {
		throw new Error('catalog is either null or undefined');
	}

	const data = udata as Catalog;
	if (data.constructor !== Object) {
		throw new Error('catalog must be a dictionary');
	}

	// We don't care about major and minor because they are actually not
	// used.

	if (!Object.prototype.hasOwnProperty.call(data, 'entries')) {
		throw new Error('catalog.entries does not exist');
	}

	const entries = data.entries;
	if (entries === null || typeof entries === 'undefined') {
		throw new Error('catalog.entries are not defined or null');
	}

	if (entries.constructor !== Object) {
		throw new Error('catalog.entries must be a dictionary');
	}

	for (const [key, value] of Object.entries(entries)) {
		if (!Array.isArray(value)) {
			throw new Error(`catalog entry for key '${key}' is not an array`);
		}
	}

	return data;
}

export function parseJsonCatalog(json: ArrayBuffer): Catalog {
	const text = new TextDecoder().decode(json);
	const data = JSON.parse(text) as unknown;

	return validateJsonCatalog(data);
}
