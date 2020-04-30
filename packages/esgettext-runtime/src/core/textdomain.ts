import { resolveImpl } from './resolve-impl';
import { CatalogCache } from './catalog-cache';
import { Catalog } from './catalog';
import { browserEnvironment } from './browser-environment';

/**
 * A Textdomain is a container for an esgettext configuration and all loaded
 * catalogs for the textual domain selected.
 */
export class Textdomain {
	private static domains: { [key: string]: Textdomain } = {};
	private static readonly cache = CatalogCache.getInstance();
	private static boundDomains: { [key: string]: string } = {};

	private domain: string;
	private format = 'json';

	private constructor() {
		/* Prevent instantiation. */
	}

	/**
	 * Instantiate a Textdomain object. Textdomain objects are singletons
	 * for each textdomain identifier.
	 *
	 * @param textdomain - the textdomain of your application or library.
	 */
	static getInstance(textdomain: string): Textdomain {
		if (
			typeof textdomain === 'undefined' ||
			textdomain === null ||
			textdomain === ''
		) {
			throw new Error('Cannot instantiate TextDomain without a textdomain');
		}
		if (Object.prototype.hasOwnProperty.call(Textdomain.domains, textdomain)) {
			return Textdomain.domains[textdomain];
		} else {
			const domain = new Textdomain();
			domain.domain = textdomain;
			Textdomain.domains[textdomain] = domain;
			return domain;
		}
	}

	/**
	 * Bind a textdomain to a certain path or queries the path that a
	 * textdomain is bound to. The catalog file will be searched
	 * in `${path}/LOCALE/LC_MESSAGES/${domainname}.EXT`.
	 *
	 * @param path - the base path for this textdomain
	 */
	bindtextdomain(path?: string): string {
		if (typeof path === 'undefined') {
			Textdomain.boundDomains[this.domain] = path;
		}

		return Textdomain.boundDomains[this.domain];
	}

	/**
	 * Resolve a textdomain, i.e. load the catalogs for this domain and all
	 * of its dependencies for the currently selected locale.
	 *
	 * The promise will always resolve. If no catalog was found, an empty
	 * catalog will be returned that is still usable.
	 *
	 * @returns a promise for a Catalog that will always resolve.
	 */
	resolve(): Promise<Catalog> {
		let path = this.bindtextdomain(this.domain);

		if (typeof path === 'undefined' || path === null) {
			if (browserEnvironment()) {
				path = '/assets/locale';
			} else {
				path = 'src/assets/locale';
			}
		}

		return resolveImpl(this.domain, Textdomain.cache, path, this.format);
	}

	/**
	 * Query or set the format to use.
	 *
	 * @param format - one of 'json' or 'mo'
	 * @returns the format selected
	 */
	public catalogFormat(format?: string): string {
		if (typeof format !== 'undefined') {
			format = format.toLowerCase();
			if (format === 'json') {
				this.format = 'json';
			} else if (format === 'mo') {
				this.format = 'mo';
			} else {
				throw new Error(`unsupported format ${format}`);
			}
		}

		return this.format;
	}

	/**
	 * Translate a simple string.
	 *
	 * @param msgid - the string to translate
	 *
	 * @returns the translated string
	 */
	_(msgid: string): string {
		return msgid;
	}

	/**
	 * Translate a string with placeholders.
	 *
	 * Placeholder names must begin with an ASCII alphabetic character (a-z, A-Z)
	 * and can be followed by an arbitrary number of ASCII alphabetic characters
	 * or ASCII digits (a-z, A-Z).
	 *
	 * @param msgid - the msgid to translate
	 * @param placeholders - a dictionary of placeholders
	 *
	 * @returns the translated string with placeholders expanded
	 */
	_x(msgid: string, placeholders: { [key: string]: string }): string {
		return this.expand(msgid, placeholders);
	}

	/**
	 * A textdomain is an identifier for your application or library. It is
	 * the basename of your translation files which are either TEXTDOMAIN.json
	 * or TEXTDOMAIN.mo, depending on the format you have chosen.
	 * @returns the textdomain
	 */
	public textdomain(): string {
		return this.domain;
	}

	private expand(msg: string, placeholders: { [key: string]: string }): string {
		return msg.replace(/\{([a-zA-Z][0-9a-zA-Z]*)\}/g, (_, match) => {
			if (Object.prototype.hasOwnProperty.call(placeholders, match)) {
				return placeholders[match];
			} else {
				return `{${match}}`;
			}
		});
	}
}