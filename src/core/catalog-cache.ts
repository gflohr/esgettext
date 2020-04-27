import { Catalog } from './catalog';

interface CatalogCacheInterface {
	// Path.
	[key: string]: {
		// Locale Key.
		[key: string]: {
			// Textdomain.
			[key: string]: Catalog | Promise<Catalog> | null;
		};
	};
}

/**
 * Caches catalog lookups by path, locale, and textdomain.
 *
 * Failed lookups are stored as null values.
 *
 * It is also possible to store a Promise. In that case, if a request is
 * made to bind the textdomain, the promise is settled. Note that this
 * mechanism is never used for message lookup but only for loading the
 * catalog via bindtextdomain.
 */
export class CatalogCache {
	private static instance: CatalogCache;
	private cache: CatalogCacheInterface = {};

	private constructor() {
		/* Singleton. */
	}

	static getInstance(): CatalogCache {
		if (!CatalogCache.instance) {
			CatalogCache.instance = new CatalogCache();
		}

		return CatalogCache.instance;
	}

	/**
	 * Lookup a Catalog for a given base path, locale, and textdomain.
	 *
	 * The base path is the path without the part LOCALE/LC_MESSAGES/, for
	 * example something like /usr/share/locale or /assets/locale.
	 *
	 * The locale key is usually the locale identifier (e.g. de-DE or sr@latin).
	 * But it can also be a colon separated list of such locale identifiers.
	 *
	 *
	 * @param path the base(!) path that the domain is bound to
	 * @param localeKey the locale key
	 * @param textdomain the textdomain
	 * @returns the cached Catalog, a Promise or null for failure
	 */
	public lookup(
		path: string,
		localeKey: string,
		textdomain: string,
	): Catalog | Promise<Catalog> | null {
		if (this.cache[path] && this.cache[path][localeKey]) {
			const ptr = this.cache[path][localeKey];
			if (Object.prototype.hasOwnProperty.call(ptr, textdomain)) {
				return ptr[textdomain];
			}
		}

		return null;
	}

	public store(
		path: string,
		localeKey: string,
		textdomain: string,
		entry: Catalog | Promise<Catalog> | null,
	): void {
		if (!this.cache[path]) {
			this.cache[path] = {};
		}
		if (!this.cache[path][localeKey]) {
			this.cache[path][localeKey] = {};
		}
		this.cache[path][localeKey][textdomain] = entry;
	}
}
