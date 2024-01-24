import { resolveImpl } from './resolve-impl';
import { CatalogCache } from './catalog-cache';
import { Catalog } from './catalog';
import { browserEnvironment } from './browser-environment';
import { gettextImpl } from './gettext-impl';
import { germanicPlural } from './germanic-plural';
import { splitLocale } from './split-locale';
import { pathSeparator } from './path-separator';
import { userLocales } from './user-locales';
import { selectLocale } from './select-locale';
import { LocaleContainer } from './locale-container';

/* eslint-disable @typescript-eslint/camelcase, tsdoc/syntax */

interface Placeholders {
	/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
	[key: string]: any;
}

/**
 * A Textdomain is a container for an esgettext configuration and all loaded
 * LocaleContainer for the textual domain selected.
 *
 * The actual translation methods have quite funny names like `_()` or
 * `_x()`. The purpose of this naming convention is to make the
 * internationalization of your programs as little obtrusive as possible.
 * Most of the times you just have to exchange
 *
 * ```
 * doSomething('Hello, world!');
 * ```
 *
 * with
 *
 * ```
 * doSomething(gtx._('Hello, world!'));
 * ```
 *
 * Besides, depending on the string extractor you are using, it may be useful
 * that the method names do not collide with method names from other packages.
 */
export class Textdomain {
	// FIXME! Use a default export instead?
	private static domains: { [key: string]: Textdomain } = {};
	private static readonly cache = CatalogCache.getInstance();
	private static boundDomains: { [key: string]: string | LocaleContainer } = {};
	private static _locale = 'C';

	private domain: string;
	private _catalogFormat = 'json';
	private catalog: Catalog;

	private constructor() {
		/* Prevent instantiation. */
	}

	/**
	 * Instantiate a Textdomain object. Textdomain objects are singletons
	 * for each textdomain identifier.
	 *
	 * @param textdomain - the textdomain of your application or library.
	 */
	getInstance: (textdomain: string) => Textdomain;

	/**
	 * Retrieve a translation for a string.
	 *
	 * @param msgid - the string to translate
	 *
	 * @returns the translated string
	 */
	_: (msgid: string) => string;

	/**
	 * Retrieve a translation for a string containing a possible plural.
	 * You will almost always want to call {@linkcode _nx} instead so that
	 * you can interpolate the number of items into the strings.
	 *
	 * @param msgid - the string in the singular
	 * @param msgidPlural - the string in the plural
	 * @param numItems - the number of items
	 *
	 * @returns the translated string
	 */
	_n: (msgid: string, msgidPlural: string, numItems: number) => string;

	/**
	 * Translate a string with a context.
	 *
	 * @param msgctxt - the message context
	 * @param msgid - the string to translate
	 *
	 * @returns the translated string
	 */
	_p: (msgctxt: string, msgid: string) => string;

	/**
	 * The method `_np()` combines `_n()` with `_p()`.
	 * You will almost always want to call {@linkcode _npx} instead so that
	 * you can interpolate the number of items into the strings.

	 *
	 * @param msgctxt - the message context
	 * @param msgid - the message id
	 * @param placeholders a dictionary with placehoders
	 * @returns the translated string
	 */
	_np: (
		msgctxt: string,
		msgid: string,
		msgidPlural: string,
		numItems: number,
	) => string;

	/**
	 * Translate a string with placeholders. The placeholders should be
	 * wrapped into curly braces and must match the regular expression
	 * "[_a-zA-Z][_a-zA-Z0-9]*".
	 *
	 * @param msgid - the msgid to translate
	 * @param placeholders - an optional dictionary of placeholders
	 *
	 * @returns the translated string with placeholders expanded
	 */
	_x: (msgid: string, placeholders?: Placeholders) => string;

	/**
	 * Translate a string with a plural expression with placeholders.
	 *
	 * @param msgid - the string in the singular
	 * @param msgidPlural - the string in the plural
	 * @param numItems - the number of items
	 * @param placeholders - an optional dictionary of placeholders
	 *
	 * @returns the translated string
	 */
	_nx: (
		msgid: string,
		msgidPlural: string,
		numItems: number,
		placeholders?: Placeholders,
	) => string;

	/**
	 * The method `_px()` combines `_p()` with `_x()`.
	 *
	 * @param msgctxt - the message context
	 * @param msgid - the message id
	 * @param placeholders an optional dictionary with placehoders
	 * @returns the translated string
	 */
	_px: (msgctxt: string, msgid: string, placeholders?: Placeholders) => string;

	/**
	 * The method `_npx()` brings it all together. It combines `_n()` and
	 * _p()` and `_x()`.
	 *
	 * @param msgctxt - the message context
	 * @param msgid - the message id
	 * @param msgidPlural - the plural string
	 * @param numItems - the number of items
	 * @param placeholders an optional dictionary with placehoders
	 * @returns the translated string
	 */
	_npx: (
		msgctxt: string,
		msgid: string,
		msgidPlural: string,
		numItems: number,
		placeholders?: Placeholders,
	) => string;

	private static getCatalog(locale: string, textdomain: string): Catalog {
		const catalog = CatalogCache.lookup(locale, textdomain);
		if (!catalog || Promise.resolve(catalog) === catalog) {
			return {
				major: 0,
				minor: 0,
				pluralFunction: germanicPlural,
				entries: {},
			};
		}

		return catalog as Catalog;
	}

	/**
	 * Retrieve a translation for a string with a fixed locale.
	 *
	 * @param locale - the locale identifier
	 * @param msgid - the string to translate
	 *
	 * @returns the translated string
	 */
	_l: (locale: string, msgid: string) => string;

	/**
	 * Retrieve a translation for a string containing a possible plural with
	 * a fixed locale.
	 * You will almost always want to call {@linkcode _nx} instead so that
	 * you can interpolate the number of items into the strings.
	 *
	 * @param locale - the locale identifier
	 * @param msgid - the string in the singular
	 * @param msgidPlural - the string in the plural
	 * @param numItems - the number of items
	 *
	 * @returns the translated string
	 */
	_ln: (
		locale: string,
		msgid: string,
		msgidPlural: string,
		numItems: number,
	) => string;

	/**
	 * Translate a string with a context with a fixed locale.
	 *
	 * @param locale - the locale identifier
	 * @param msgctxt - the message context
	 * @param msgid - the string to translate
	 *
	 * @returns the translated string
	 */
	_lp: (locale: string, msgctxt: string, msgid: string) => string;

	/**
	 * The method `_lnp()` combines `_ln()` with `_lp()`.
	 * You will almost always want to call {@linkcode _npx} instead so that
	 * you can interpolate the number of items into the strings.

	 *
	 * @param locale - the locale identifier
	 * @param msgctxt - the message context
	 * @param msgid - the message id
	 * @param placeholders a dictionary with placehoders
	 * @returns the translated string
	 */
	_lnp: (
		locale: string,
		msgctxt: string,
		msgid: string,
		msgidPlural: string,
		numItems: number,
	) => string;

	/**
	 * Translate a string with placeholders for a fixed locale.
	 * The placeholders should be
	 * wrapped into curly braces and must match the regular expression
	 * "[_a-zA-Z][_a-zA-Z0-9]*".
	 *
	 * @param locale - the locale identifier
	 * @param msgid - the msgid to translate
	 * @param placeholders - an optional dictionary of placeholders
	 *
	 * @returns the translated string with placeholders expanded
	 */
	_lx: (locale: string, msgid: string, placeholders?: Placeholders) => string;

	/**
	 * Translate a string with a plural expression with placeholders into a
	 * fixed locale.
	 *
	 * @param locale - the locale identifier
	 * @param msgid - the string in the singular
	 * @param msgidPlural - the string in the plural
	 * @param numItems - the number of items
	 * @param placeholders - an optional dictionary of placeholders
	 *
	 * @returns the translated string
	 */
	_lnx: (
		locale: string,
		msgid: string,
		msgidPlural: string,
		numItems: number,
		placeholders?: Placeholders,
	) => string;

	/**
	 * The method `_lpx()` combines `_lp()` with `_lx()`.
	 *
	 * @param locale - the locale identifier
	 * @param msgctxt - the message context
	 * @param msgid - the message id
	 * @param placeholders an optional dictionary with placehoders
	 * @returns the translated string
	 */
	_lpx: (msgctxt: string, msgid: string, placeholders?: Placeholders) => string;

	/**
	 * The method `_lnpx()` brings it all together. It combines `_ln()` and
	 * _lp()` and `_lx()`.
	 *
	 * @param locale - the locale identifier
	 * @param msgctxt - the message context
	 * @param msgid - the message id
	 * @param msgidPlural - the plural string
	 * @param numItems - the number of items
	 * @param placeholders an optional dictionary with placehoders
	 * @returns the translated string
	 */
	_lnpx: (
		locale: string,
		msgctxt: string,
		msgid: string,
		msgidPlural: string,
		numItems: number,
		placeholders?: Placeholders,
	) => string;

	private static expand(
		msg: string,
		placeholders: { [key: string]: string },
	): string {
		return msg.replace(/\{([a-zA-Z][0-9a-zA-Z]*)\}/g, (_, match) => {
			if (Object.prototype.hasOwnProperty.call(placeholders, match)) {
				return placeholders[match];
			} else {
				return `{${match}}`;
			}
		});
	}

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
			domain.catalog = {
				major: 0,
				minor: 0,
				pluralFunction: germanicPlural,
				entries: {},
			};

			/* We generate most of the methods dynamically.  This is really
			 * ugly but it reduces the size of the bundle significantly.
			 */
			if (typeof Textdomain.prototype['_'] !== 'function') {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const g = gettextImpl;
				// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/unbound-method
				const x = Textdomain.expand;
				// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/unbound-method
				const lk = CatalogCache.lookup;
				// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/unbound-method
				const gc = this.getCatalog;

				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const e = {
					major: 0,
					minor: 0,
					pluralFunction: germanicPlural,
					entries: {},
				};

				// Arguments in standardized order.
				const argNames = ['msgctxt', 'msgid', 'msgidPlural', 'numItems'];

				// Method signatures (range of arguments to pick.)
				const methodArgs: { [key: string]: Array<number> } = {
					'': [1, 2],
					n: [1, 4],
					p: [0, 2],
					np: [0, 4],
				};

				const tp = 'Textdomain.prototype._';
				const f = 'function';
				const c = 'catalog:this.catalog';
				const tc = 'const catalog=Textdomain.getCatalog(l,this.textdomain());';
				const cc = 'catalog:catalog';
				const rg = 'return g';
				const rx = 'return x';
				for (const m in methodArgs) {
					if ({}.hasOwnProperty.call(methodArgs, m)) {
						const range = methodArgs[m];
						const slice = argNames.slice(range[0], range[1]);
						const a = slice.join(',');
						const k = slice.map(a => `${a}:${a}`).join(',');
						// FIXME! expand arguments msgid => msgid: msgid!  But
						// shorten the actual arguments to single letters.

						// eslint-disable-next-line no-eval
						eval(`
${tp}${m}=${f}(${a}){${rg}({${k},${c}});};
${tp}l${m}=${f}(l,${a}){${tc}${rg}({${k},${cc}});};
${tp}${m}x=${f}(${a},p){${rx}(g({${k},${c}}),p||{});};
${tp}l${m}x=${f}(l,${a},p){${tc}${rx}(g({${k},${cc}}),p||{});};
`);
					}
				}
			}

			return domain;
		}
	}

	/**
	 * Delete all existing singletons. This method should usually be called
	 * only, when you want to free memory.
	 */
	static clearInstances(): void {
		Textdomain.boundDomains = {};
	}

	/**
	 * This method is used for testing.  Do not use it yourself!
	 */
	static forgetInstances(): void {
		Textdomain.clearInstances();
		Textdomain.domains = {};
	}

	/**
	 * Query the locale in use.
	 */
	static get locale(): string {
		return Textdomain._locale;
	}

	/**
	 * Change the locale.
	 *
	 * For the web you can use all valid language identifier tags that
	 * [BCP47](https://tools.ietf.org/html/bcp47) allows
	 * (and actually a lot more). The tag is always used unmodified.
	 *
	 * For server environments, the locale identifier has to match the following
	 * scheme:
	 *
	 *   `ll_CC.charset\@modifier`
	 *
	 * * `ll` is the two- or three-letter language code.
	 * * `CC` is the optional two-letter country code.
	 * * `charset` is an optional character set (letters, digits, and the hyphen).
	 * * `modifier` is an optional variant (letters and digits).
	 *
	 * The language code is always converted to lowercase, the country code is
	 * converted to uppercase, variant and charset are used as is.
	 *
	 * @param locale - the locale identifier
	 * @returns the locale in use
	 */
	static set locale(locale: string) {
		const ucLocale = locale.toUpperCase();

		if (ucLocale === 'POSIX' || ucLocale === 'C') {
			this._locale = 'POSIX';
			return;
		}

		const split = splitLocale(locale);
		if (!split) {
			throw new Error('invalid locale identifier');
		}

		// The check from splitLocale() is sufficient.
		if (browserEnvironment()) {
			this._locale = locale;
			return;
		}

		// Node.
		split.tags[0] = split.tags[0].toLowerCase();
		if (split.tags.length > 1) {
			split.tags[1] = split.tags[1].toUpperCase();
		}

		const separator = split.underscoreSeparator ? '_' : '-';
		this._locale = split.tags.join(separator);

		if (typeof split.charset !== 'undefined') {
			this._locale += '.' + split.charset;
		}

		if (typeof split.modifier !== 'undefined') {
			this._locale += '@' + split.modifier;
		}
	}

	/**
	 * A textdomain is an identifier for your application or library. It is
	 * the basename of your translation files which are either TEXTDOMAIN.json
	 * or TEXTDOMAIN.mo, depending on the format you have chosen.
	 *
	 * FIXME! This should be a getter!
	 *
	 * @returns the textdomain
	 */
	public textdomain(): string {
		return this.domain;
	}

	/**
	 * Bind a textdomain to a certain path or queries the path that a
	 * textdomain is bound to. The catalog file will be searched
	 * in `${path}/locale/LC_MESSAGES/${domainname}.EXT`.
	 *
	 * Alternatively, you can pass a [[`LocaleContainer`]] that holds the
	 * catalogs in memory.
	 *
	 * @param path - the base path or [[`LocaleContainer`]] for this textdomain
	 */
	bindtextdomain(path?: string | LocaleContainer): string | LocaleContainer {
		if (typeof path !== 'undefined') {
			Textdomain.boundDomains[this.domain] = path;
		}

		return Textdomain.boundDomains[this.domain];
	}

	/**
	 * Resolve a textdomain, i.e. load the LocaleContainer for this domain and all
	 * of its dependencies for the currently selected locale or the locale
	 * specified.
	 *
	 * The promise will always resolve. If no catalog was found, an empty
	 * catalog will be returned that is still usable.
	 *
	 * @param locale - an optional locale identifier, defaults to Textdomain.locale
	 *
	 * @returns a promise for a Catalog that will always resolve.
	 */
	async resolve(locale?: string): Promise<Catalog> {
		const promises = [this.resolve1(locale)];
		for (const td in Textdomain.domains) {
			if (
				Object.prototype.hasOwnProperty.call(Textdomain.domains, td) &&
				Textdomain.domains[td] !== this
			) {
				promises.push(Textdomain.domains[td].resolve1(locale));
			}
		}

		return Promise.all(promises).then(values => {
			return new Promise(resolve => resolve(values[0]));
		});
	}

	private async resolve1(locale?: string): Promise<Catalog> {
		let path = this.bindtextdomain();

		if (typeof path === 'undefined' || path === null) {
			const parts = browserEnvironment()
				? ['', 'assets', 'locale']
				: ['src', 'assets', 'locale'];
			path = parts.join(pathSeparator());
		}

		const resolvedLocale = locale ? locale : Textdomain.locale;
		return resolveImpl(
			this.domain,
			path,
			this.catalogFormat,
			resolvedLocale,
		).then(catalog => {
			if (!locale) {
				this.catalog = catalog;
			}
			return new Promise(resolve => resolve(catalog));
		});
	}

	/**
	 * Get the catalog format in use.
	 *
	 * @returns one of 'json' or 'mo' (default is 'json')
	 */
	get catalogFormat(): string {
		return this._catalogFormat;
	}

	/**
	 * Set the catalog format to use.
	 *
	 * @param format - one of 'json' or 'mo'
	 */
	set catalogFormat(format: string) {
		format = format.toLowerCase();
		if (format === 'json') {
			this._catalogFormat = 'json';
		} else if (format === 'mo') {
			this._catalogFormat = 'mo';
		} else {
			throw new Error(`unsupported format ${format}`);
		}
	}

	/**
	 * Queries the user's preferred locales. On the server it queries the
	 * environment variables `LANGUAGE`, `LC_ALL`, `LANG`, and `LC_MESSAGES`
	 * (in that order). In the browser, it parses it checks the user preferences
	 * in the variables `navigator.languages`, `navigator.language`,
	 * `navigator.userLanguage`, `navigator.browserLanguage`, and
	 * `navigator.systemLanguage`.
	 *
	 * @returns the set of locales in order of preference
	 *
	 * Added in \@runtime 0.1.0.
	 */
	static userLocales(): Array<string> {
		return userLocales();
	}

	/**
	 * Select one of the supported locales from a list of locales accepted by
	 * the user.
	 *
	 * @param supported - the list of locales supported by the application
	 * @param requested - the list of locales accepted by the user
	 *
	 * If called with just one argument, then the list of requested locales
	 * is determined by calling [[Textdomain.userLocales]].
	 *
	 * @returns the negotiated locale or 'C' if not possible.
	 */
	static selectLocale(
		supported: Array<string>,
		requested?: Array<string>,
	): string {
		return selectLocale(
			supported,
			requested === null ? Textdomain.userLocales() : requested,
		);
	}

	/**
	 * A no-op method for string marking.
	 *
	 * Sometimes you want to mark strings for translation but do not actually
	 * want to translate them, at least not at the time of their definition.
	 * This is often the case, when you have to preserve the original string.
	 *
	 * Take this example:
	 *
	 * ```
	 * orangeColors = [gtx.N_('coral'), gtx.N_('tomato'), gtx.N_('orangered'),
	 *                 gtx.N_('gold'), gtx.N_('orange'), gtx.N_('darkorange')]
	 * ```
	 *
	 * These are standard CSS colors, and you cannot translate them inside
	 * CSS styles. But for presentation you may want to translate them later:
	 *
	 * ```
	 * console.log(gtx._x("The css color '{color}' is {translated}.",
	 *                    {
	 *                        color: orangeColors[2],
	 *                        translated: gtx._(orangeColors[2]),
	 *                    }
	 *            )
	 * );
	 * ```
	 *
	 * In other words: The method just marks strings for translation, so that
	 * the extractor `esgettext-xgettext` finds them but it does not actually
	 * translate anything.
	 *
	 * Similar methods are available for other cases (with placeholder
	 * expansion, context, or both). They are *not* available for plural
	 * methods because that would not make sense.
	 *
	 * Note that all of these methods are also available as instance methods.
	 *
	 * @param msgid - the message id
	 * @returns the original string
	 */
	static N_(msgid: string): string {
		return msgid;
	}

	/**
	 * Does the same as the static method `N_()`.
	 *
	 * @param msgid - the message id
	 * @returns the original string
	 */
	N_(msgid: string): string {
		return msgid;
	}

	/**
	 * Same as `N_()` but with placeholder expansion.
	 *
	 * @param msgid - the message id
	 * @param placeholders - a dictionary of placeholders
	 * @returns the original string with placeholders expanded
	 */
	N_x(msgid: string, placeholders?: Placeholders): string {
		return Textdomain.expand(msgid, placeholders);
	}

	/**
	 * Does the same as the static method `N_x()`.
	 *
	 * @param msgid - the message id
	 * @param placeholders - a dictionary of placeholders
	 * @returns the original string with placeholders expanded
	 */
	static N_x(msgid: string, placeholders?: Placeholders): string {
		return Textdomain.expand(msgid, placeholders);
	}

	/**
	 * Same as `N_()` but with context.
	 *
	 * @params _msgctxt - the message context
	 * @param msgid - the message id
	 * @returns the original string
	 */
	N_p(_msgctxt: string, msgid: string): string {
		return msgid;
	}

	/**
	 * Does the same as the static method `N_p()`.
	 *
	 * @param msgid - the message id
	 * @param placeholders - a dictionary of placeholders
	 * @returns the original string with placeholders expanded
	 */
	static N_p(_msgctxt: string, msgid: string): string {
		return msgid;
	}

	/**
	 * Same as `N_()` but with context and placeholder expansion.
	 *
	 * @param msgctxt - the message context
	 * @param msgid - the message id
	 * @param placeholders - a dictionary of placeholders
	 * @returns the original string with placeholders expanded
	 */
	N_px(_msgctxt: string, msgid: string, placeholders?: Placeholders): string {
		return Textdomain.expand(msgid, placeholders);
	}

	/**
	 * Does the same as the static method `N_px()`.
	 *
	 * @param msgctxt - the message context
	 * @param msgid - the message id
	 * @param placeholders - a dictionary of placeholders
	 * @returns the original string with placeholders expanded
	 */
	static N_px(
		_msgctxt: string,
		msgid: string,
		placeholders?: Placeholders,
	): string {
		return Textdomain.expand(msgid, placeholders);
	}
}
