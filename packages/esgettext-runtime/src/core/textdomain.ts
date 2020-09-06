import { resolveImpl } from './resolve-impl';
import { CatalogCache } from './catalog-cache';
import { Catalog } from './catalog';
import { browserEnvironment } from './browser-environment';
import { gettextImpl } from './gettext-impl';
import { germanicPlural } from './germanic-plural';
import { splitLocale } from './split-locale';
import { pathSeparator } from './path-separator';
import { userLocales } from './user-locales';

/* eslint-disable @typescript-eslint/camelcase, tsdoc/syntax */

interface Placeholders {
	/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
	[key: string]: any;
}

/**
 * A Textdomain is a container for an esgettext configuration and all loaded
 * catalogs for the textual domain selected.
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
	private static domains: { [key: string]: Textdomain } = {};
	private static readonly cache = CatalogCache.getInstance();
	private static boundDomains: { [key: string]: string } = {};
	private static _locale = 'C';

	private domain: string;
	private _catalogFormat = 'json';
	private catalog: Catalog;

	private constructor() {
		/* Prevent instantiation. */
	}

	/**
	 * The basic and most-used method. If your code loooked like this
	 * until now:
	 *
	 * ```
	 * console.log('permission denied');
	 * ```
	 *
	 * You will now write:
	 *
	 * ```
	 * console.log(gtx._(permission denied'));
	 * ```
	 *
	 * That's all, the string will be output in the user's preferred
	 * language, provided that you have installed a translation for it.
	 *
	 * @param msgid - the string to translate
	 *
	 * @returns the translated string
	 */
	_: (msgid: string) => string;

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
			domain.catalog = {
				major: 0,
				minor: 0,
				pluralFunction: germanicPlural,
				entries: {},
			};

			/* Generate all trivial methods.  */
			if (typeof Textdomain.prototype['_'] !== 'function') {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const gettext = gettextImpl;

				// Arguments in standardized order.
				//const args = ['msgctxt', 'msgid', 'msgidPlural', 'numItems'];

				// Method signatures (range of arguments to pick.)
				// const methods = {
				// 	_: [1, 1],
				// 	_n: [1, 3],
				// 	_p: [0, 1],
				// 	_np: [0, 3],
				// };

				// eslint-disable-next-line no-eval
				eval(`Textdomain.prototype['_'] = function (msgid) {
					return gettext({
						msgid,
						catalog: this.catalog,
					});
				}`);
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
	 * in `${path}/LOCALE/LC_MESSAGES/${domainname}.EXT`.
	 *
	 * @param path - the base path for this textdomain
	 */
	bindtextdomain(path?: string): string {
		if (typeof path !== 'undefined') {
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
	async resolve(): Promise<Catalog> {
		let path = this.bindtextdomain();

		if (typeof path === 'undefined' || path === null) {
			const parts = browserEnvironment()
				? ['', 'assets', 'locale']
				: ['src', 'assets', 'locale'];
			path = parts.join(pathSeparator());
		}

		return resolveImpl(
			this.domain,
			path,
			this.catalogFormat,
			Textdomain.locale,
		).then(catalog => {
			this.catalog = catalog;
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
	 * (in that order). In the browser
	 *
	 * @returns the set of locales in order of preference
	 *
	 * Added in \@esgettext-runtime 0.1.0.
	 */
	static userLocales(): Array<string> {
		return userLocales();
	}

	/**
	 * Translate a string with placeholders.
	 *
	 * A naive approach to translate a string may look like this:
	 *
	 * ```
	 * gtx._(`This is the ${color} ${thing}.`);
	 * ```
	 *
	 * Alas, that would be nice, but it is not possible. Remember that the
	 * method _() serves both as an operator for translating strings
	 * *and* as a mark for translatable strings. If the above string would
	 * get extracted from your JavaScript code, the un-interpolated form would
	 * end up in the message catalog because when parsing your code it is
	 * unpredictable what values the variables `thing` and `color` will have
	 * at run-time (this fact is most probably one of the reasons you have
	 * written your program for).
	 *
	 * However, at run-time, the JavaScript engine will have interpolated the
	 * values already *before* _() has seen the
	 * original string. Consequently something like "This is the red
	 * car." will be looked up in the message catalog, it will not be
	 * found (because only "This is the \${color} \${thing}." is included in
	 * the database), and the original, untranslated string will be
	 * returned. Consequently `esgettext-xgettext` will bail out with an error
	 * message if it comes across a translation call with an argument that is
	 * a backtick string.
	 *
	 * What you should do instead is to use placeholders:
	 *
	 * ```
	 * 'This is the {color} {thing}.';
	 * ```
	 *
	 * Placeholders must start with an alphabetic ASCII(!) character ("a" to
	 * "z" and "A" to "Z") followed by an arbitrary number of alphabetic
	 * ASCII characters or ASCII decimal digits ("0" to "9"). You cannot
	 * use special characters inside placeholders! It is also not possible
	 * (and not needed) to use arbitrary JavaScript expressions!
	 *
	 * The call with interpolation then looks like this:
	 *
	 * ```
	 * console.log(gtx._x('This is the {color} {thing}.\n', {
	 *                        thing: thang,
	 *                        color: 'yellow',
	 *                    });
	 * ```
	 *
	 * The method _x() will take the additional dictionary and replace all
	 * occurencies of the dictionary keys in curly braces with the corresponding
	 * values. Simple, readable, understandable to translators, what else
	 * would you want? And if the translator forgets, misspells or
	 * otherwise messes up some "variables", the msgfmt(1) program, that is
	 * used to compile the textual translation file into its binary
	 * representation will even choke on these errors and refuse to compile
	 * the translation.
	 *
	 * @param msgid - the msgid to translate
	 * @param placeholders - a dictionary of placeholders
	 *
	 * @returns the translated string with placeholders expanded
	 */
	_x(msgid: string, placeholders: Placeholders): string {
		return Textdomain.expand(
			gettextImpl({
				msgid,
				catalog: this.catalog,
			}),
			placeholders,
		);
	}

	/**
	 * This method is complicated and is best explained with an
	 * example. We'll have another look at your vintage code:
	 *
	 * ```
	 * if (files_deleted === 1) {
	 *     console.log('One file has been deleted.');
	 * } else {
	 *     console.log('All files have been deleted.\n);
	 * }
	 * ```
	 *
	 * Your intent is clear, you wanted to avoid the cumbersome "1 files
	 * deleted". This is okay for English, but other languages have more
	 * than one plural form. For example in Russian it makes a difference
	 * whether you want to say 1 file, 3 files or 6 files. You will use
	 * three different forms of the noun 'file' in each case. (Note: Yep,
	 * very smart you are, the Russian word for 'file' is in fact the
	 * English word, and it is an invariable noun, but if you know that,
	 * you will also understand the rest despite this little simplification
	 * ...).
	 *
	 * That is the reason for the existance of the method `_n()`.
	 *
	 * ```
	 * console.log(gtx._n('One file has been deleted.',
	 *                    'All files have been deleted.',
	 *                     files_deleted));
	 * ```
	 *
	 * The effect is that `esgettext-runtime` will find out which
	 * plural form to pick for your user's language, and the output string
	 * will always look okay.
	 *
	 * It should be mentioned that the method is rarely useful because messages
	 * with plural forms will almost always require the use of placeholders.
	 * See `_nx()` below for a solution.
	 *
	 * @param msgid - the string in the singular
	 * @param msgidPlural - the string in the plural
	 * @param numItems - the number of items
	 *
	 * @returns the translated string
	 */
	_n(msgid: string, msgidPlural: string, numItems: number): string {
		return gettextImpl({
			msgid,
			catalog: this.catalog,
			msgidPlural,
			numItems,
		});
	}

	/**
	 * The method normally used for plural expressions.
	 *
	 * ```
	 * console.log(__nx('One file has been deleted.',
	 *                  '{count} files have been deleted.',
	 *                  num_files,
	 *                  { count: num_files }));
	 * ```
	 *
	 * The method __nx() picks the correct plural form (also for
	 * English!) *and* it is capable of interpolating variables into
	 * strings.
	 *
	 * Have a close look at the order of arguments: The first argument is
	 * the string in the singular, the second one is the plural string. The
	 * third one is an integer indicating the number of items. This third
	 * argument is *only* used to pick the correct plural form. The
	 * last argument is used for
	 * interpolation. In the beginning it is often a little confusing that
	 * the variable holding the number of items will usually be repeated
	 * somewhere in the interpolation dictionary.
	 *
	 * @param msgid - the string in the singular
	 * @param msgidPlural - the string in the plural
	 * @param numItems - the number of items
	 * @param placeholders - a dictionary of placeholders
	 *
	 * @returns the translated string
	 */
	_nx(
		msgid: string,
		msgidPlural: string,
		numItems: number,
		placeholders: Placeholders = {},
	): string {
		return Textdomain.expand(
			gettextImpl({
				msgid,
				catalog: this.catalog,
				msgidPlural,
				numItems,
			}),
			placeholders,
		);
	}

	/**
	 * Translate a string with a context.
	 *
	 * This is much like __. The "p" stands for "particular", and the
	 * MSGCTXT is used to provide context to the translator. This may be
	 * neccessary when your string is short, and could stand for multiple
	 * things. For example:
	 *
	 * ```
	 * console.log(gtx._p('Verb, to view', 'View'));
	 * console.log(gtx._p('Noun, a view', 'View'));
	 * ```
	 *
	 * The above may be the "View" entries in a menu, where View-\>Source and
	 * File-\>View are different forms of "View", and likely need to be
	 * translated differently.
	 *
	 * A typical usage are GUI programs. Imagine a program with a main menu
	 * and the notorious "Open" entry in the "File" menu. Now imagine,
	 * there is another menu entry Preferences-\>Advanced-\>Policy where you
	 * have a choice between the alternatives "Open" and "Closed". In
	 * English, "Open" is the adequate text at both places. In other
	 * languages, it is very likely that you need two different
	 * translations. Therefore, you would now write:
	 *
	 * gtx._p('File|', 'Open');
	 * gtx._p('Preferences|Advanced|Policy', 'Open');
	 *
	 * In English, or if no translation can be found, the second argument
	 * (MSGID) is returned.
	 *
	 * @param msgctxt - the message context
	 * @param msgid - the string to translate
	 *
	 * @returns the translated string
	 */
	_p(msgctxt: string, msgid: string): string {
		return gettextImpl({
			msgid,
			catalog: this.catalog,
			msgctxt,
		});
	}

	/**
	 * The method `_px()` combines `_p()` with `_x()`.
	 *
	 * @param msgctxt - the message context
	 * @param msgid - the message id
	 * @param placeholders a dictionary with placehoders
	 * @returns the translated string
	 */
	_px(msgctxt: string, msgid: string, placeholders: Placeholders = {}): string {
		return Textdomain.expand(
			gettextImpl({
				msgid,
				catalog: this.catalog,
				msgctxt,
			}),
			placeholders,
		);
	}

	/**
	 * The method `_np()` combines `_n()` with `_p()`. Normally you will
	 * want to use `_npx()` instead, so that you can interpolate numbers.
	 *
	 * @param msgctxt - the message context
	 * @param msgid - the message id
	 * @param placeholders a dictionary with placehoders
	 * @returns the translated string
	 */
	_np(
		msgctxt: string,
		msgid: string,
		msgidPlural: string,
		numItems: number,
	): string {
		return gettextImpl({
			msgid,
			catalog: this.catalog,
			msgctxt,
			msgidPlural,
			numItems,
		});
	}

	/**
	 * The method `_npx()` brings it all together. It combines `_n()` and
	 * _p()` and `_x()`.
	 *
	 * @param msgctxt - the message context
	 * @param msgid - the message id
	 * @param msgidPlural - the plural string
	 * @param numItems - the number of items
	 * @param placeholders a dictionary with placehoders
	 * @returns the translated string
	 */
	_npx(
		msgctxt: string,
		msgid: string,
		msgidPlural: string,
		numItems: number,
		placeholders: Placeholders = {},
	): string {
		return Textdomain.expand(
			gettextImpl({
				msgid,
				catalog: this.catalog,
				msgidPlural,
				numItems,
				msgctxt,
			}),
			placeholders,
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
	 * Note that all of these methods are also available as class methods.
	 *
	 * @param msgid - the message id
	 * @returns the original string
	 */
	static N_(msgid: string): string {
		return msgid;
	}

	/**
	 * Does the same as the instance method `N_()`.
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
	 * Does the same as the instance method `N_x()`.
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
	 * Does the same as the instance method `N_p()`.
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
	 * Does the same as the instance method `N_px()`.
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
}
