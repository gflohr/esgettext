/**
 * The set of translations found in a [[`Catalog`]].
 *
 * This interface is used internally. You will only need it if you want to
 * write your own message retrieval method or want to inspect a loaded
 * [[`Catalog`]].
 *
 * The translations are looked up by their singular form in the original
 * language. The value is an array of strings. The first item is the singular
 * translation, the optional following items are the plural forms.
 *
 * If a translation has a message context, the key is the context joined
 * with the translation by a `'\u0004'` character. For example, the key for
 * the msgid "Open" with the msgctxt "Menu|File" would be `Menu|File\u0004Open`.
 */
export interface CatalogEntries {
	[key: string]: Array<string>;
}

/**
 * A [[`Catalog`]] is a container for a set of translations loaded from a
 * `mo.json` or a binary `.mo` file.
 *
 * This interface is used internally. You will only need it if you want to
 * write your own message retrieval method or want to inspect a loaded
 * [[`Catalog`]].
 */
export interface Catalog {
	/** The major revision number of the catalog, currently always 0. */
	major: number;

	/** The minor revision number of the catalog, currently always 0 or 1. */
	minor: number;

	/**
	 * Compute the index of a plural form from a number of items. If a language
	 * has one singular and two plural forms, the singular form would have
	 * index 0 and the plural forms have index 1 and 2.
	 *
	 * The plural function would then compute one of 0, 1, or 2 from an
	 * arbitrary non-negative integer.
	 *
	 * @param numItems - the number of items.
	 *
	 * @returns the index of the plural form.
	 */
	pluralFunction(numItems: number): number;

	/** The actual translations. */
	entries: CatalogEntries;
}
