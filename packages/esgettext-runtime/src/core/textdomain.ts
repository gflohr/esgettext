import { resolveImpl } from './resolve-impl';
import { CatalogCache } from './catalog-cache';
import { Catalog } from './catalog';
import { browserEnvironment } from './browser-environment';
import { gettextImpl } from './gettext-impl';
import { germanicPlural } from './germanic-plural';

interface Placeholders {
	/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
	[key: string]: any;
}

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

		return resolveImpl(this.domain, Textdomain.cache, path, this.format).then(
			(catalog) => {
				this.catalog = catalog;
				return new Promise((resolve) => resolve(catalog));
			},
		);
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
	 * The basic and most-used function. If your code loooked like this
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
	_(msgid: string): string {
		return gettextImpl({
			msgid,
			catalog: this.catalog,
		});
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
	 * found (because only "This is the ${color} ${thing}." is included in
	 * the database), and the original, untranslated string will be
	 * returned. Consequently `esgettext-xgettext` will bail out with an error
	 * message if it comes across a translation call with an argument that is
	 * a backtick string.
	 *
	 * What you should do instead is to use placeholders:
	 *
	 * ```
	 * 'This is the {color} {thing}.\n';
	 *
	 * Placeholders must start with an alphabetic ASCII(!) character ("a" to
	 * "z" and "A" to "Z") followed by an arbitrary number of alphabetic
	 * ASCII characters or ASCII decimal digits ("0" to "9"). You cannot
	 * use special characters inside placehodlers! It is also not possible
	 * (and not needed) to use arbitrary JavaScript expressions!
	 *
	 * The call with interpolation then looks like this:
	 *
	 * ```
	 * console.log('This is the {color} {thing}.\n', {
	 *                 thing: thang,
	 *                 color => 'yellow');
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
		return this.expand(
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
	 * The function __nx() picks the correct plural form (also for
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
	) {
		return this.expand(
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
	 *
	 * The above may be the "View" entries in a menu, where View->Source and
	 * File->View are different forms of "View", and likely need to be
	 * translated differently.
	 *
	 * A typical usage are GUI programs. Imagine a program with a main menu
	 * and the notorious "Open" entry in the "File" menu. Now imagine,
	 * there is another menu entry Preferences->Advanced->Policy where you
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

	_px(msgctxt: string, msgid: string, placeholders: Placeholders = {}): string {
		return this.expand(
			gettextImpl({
				msgid,
				catalog: this.catalog,
				msgctxt,
			}),
			placeholders,
		);
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
