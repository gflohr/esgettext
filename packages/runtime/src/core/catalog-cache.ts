import { validateJsonCatalog } from '../parser';
import { Catalog } from './catalog';

interface CatalogCacheInterface {
	// Locale Key.
	[key: string]: {
		// Textdomain.
		[key: string]: Catalog | Promise<Catalog> | null;
	};
}

/*
 * Caches catalog lookups by path, locale, and textdomain.
 *
 * Failed lookups are stored as null values.
 *
 * It is also possible to store a Promise. In that case, if a request is
 * made to bind the textdomain, the promise is settled. Note that this
 * mechanism is never used for message lookup but only for loading the
 * catalog via resolve.
 */
export class CatalogCache {
	private static instance: CatalogCache;
	private static cache: CatalogCacheInterface = {};

	private constructor() {
		/* Singleton. */
	}

	static getInstance(): CatalogCache {
		if (!CatalogCache.instance) {
			CatalogCache.instance = new CatalogCache();
		}

		return CatalogCache.instance;
	}

	static clear(): void {
		CatalogCache.cache = {};
	}

	/**
	 * Lookup a Catalog for a given base path, locale, and textdomain.
	 *
	 * The locale key is usually the locale identifier (e.g. de-DE or sr\@latin).
	 * But it can also be a colon separated list of such locale identifiers.
	 *
	 *
	 * @param localeKey - the locale key
	 * @param textdomain - the textdomain
	 * @returns the cached Catalog, a Promise or null for failure
	 */
	public static lookup(
		localeKey: string,
		textdomain: string,
	): Catalog | Promise<Catalog> {
		if (CatalogCache.cache[localeKey]) {
			const ptr = CatalogCache.cache[localeKey];
			if (Object.prototype.hasOwnProperty.call(ptr, textdomain)) {
				return ptr[textdomain];
			}
		}

		return null;
	}

	public static store(
		localeKey: string,
		textdomain: string,
		entry: Catalog | Promise<Catalog>,
	): void {
		if (Promise.resolve(entry) !== entry) {
			// Object.
			entry = validateJsonCatalog(entry as Catalog);
		}

		if (!CatalogCache.cache[localeKey]) {
			CatalogCache.cache[localeKey] = {};
		}
		CatalogCache.cache[localeKey][textdomain] = entry;
	}
}
