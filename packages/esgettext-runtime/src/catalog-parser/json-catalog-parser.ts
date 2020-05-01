import { Catalog } from '../core/catalog';
import { CatalogValidator } from '../catalog-validator';
import { CatalogParser } from '.';

export class JsonCatalogParser implements CatalogParser, CatalogValidator {
	validate(data: Catalog): Catalog {
		// We could use ajv but it results in almost 300 k minimized code
		// for the browser bundle. This validator instead is absolutely
		// minimalistic, and only avoids exceptions that can occur, when
		// accessing entries.

		if (typeof data === 'undefined') {
			throw new Error('catalog is not defined');
		}

		if (data.constructor !== Object) {
			throw new Error('catalog must be a dictionary');
		}

		// We don't care about major and minor because they are actually not
		// used.

		const entries = data.entries;
		if (typeof entries === 'undefined') {
			throw new Error('catalog.entries is not defined');
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

	parse(buffer: ArrayBuffer): Catalog {
		return JSON.parse(new TextDecoder('utf-8').decode(buffer)) as Catalog;
	}
}
