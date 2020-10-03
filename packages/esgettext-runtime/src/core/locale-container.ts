import { Catalog } from './catalog';

/**
 * An object storing locale information.  It resembles the directory structure
 * that [[`Catalog`]] objects are found in.
 *
 * Example, if your textdomain is 'myapp':
 *
 * <pre class="language-javascript"><code class="language-javascript">{
 *         fr: {
 *                 LC_MESSAGES: {
 * 	                       myapp: catalogs['fr']
 *                 }
 *         },
 *         'de-DE': {
 *                 LC_MESSAGES: {
 *                         myapp: catalogs['de-DE']
 *                 }
 *         }
 * }
 * </code></pre>
 */
export interface LocaleContainer {
	/** A language code like 'fr' or 'de-DE'. */
	[key: string]: {
		/** The Locale category, always 'LC_MESSAGES'. */
		[key: string]: {
			/** The textdomain. */
			[key: string]: Catalog;
		};
	};
}
