import * as isNode from 'detect-node';

/* eslint no-underscore-dangle: "off" */

//let useJSONCatalog = true;
let isBrowser = isNode ? false : true;
let useLocale = 'POSIX';
const browserLocaleRegex = new RegExp('^[a-z0-9]+(?:-[a-z0-9]+)*', 'i');
const nodeLocaleRegex = new RegExp(
	'^([a-z]{2})(?:-([a-z]{2}))?(?:@([a-z]+))?(?:.([-a-z0-9]+))?$',
	'i',
);

interface Placeholder {
	[index: string]: string;
}

function expand(msg: string, placeholders: Placeholder): string {
	return msg.replace(/\{([a-zA-Z][0-9a-zA-Z]*)\}/g, (_, match) => {
		if (Object.prototype.hasOwnProperty.call(placeholders, match)) {
			return placeholders[match];
		} else {
			return `{${match}}`;
		}
	});
}

/**
 * Force an execution environment. By default, the environment (NodeJS or
 * browser) is auto-detected. You can force the library to assume a certain
 * environment with this function.
 *
 * @param browser whether to assume a browser or not
 */
export function useBrowser(browser: boolean): void {
	isBrowser = browser;
}

/**
 * Set the preferred message format.
 *
 * @param json true if json should preferred over mo files.
 *
 * The library can either load message catalogs in GtxI18N JSON or
 * in mo format.
 */
export function useJSON(_json: boolean): void {
	//useJSONCatalog = json;
}

/**
 * Change the locale.
 *
 * @param locale the locale identifier
 */
export function setLocale(locale: string): string {
	const ucLocale = locale.toUpperCase();

	if (ucLocale === 'POSIX' || ucLocale === 'C') {
		useLocale = ucLocale;
	} else if (isBrowser && browserLocaleRegex.exec(locale)) {
		useLocale = locale;
	} else if (!isBrowser) {
		const match = nodeLocaleRegex.exec(locale);
		if (match) {
			// The language and region are case-converted so that you can use
			// the same locale identifiers for the web and the command-line.
			useLocale = match[1].toLowerCase();
			if (match[2]) {
				useLocale += '-' + match[2].toUpperCase();
			}
			// But do *not* convert a possible modifier and charset.
			if (match[3]) {
				useLocale += '@' + match[3];
			}
			if (match[4]) {
				useLocale += '.' + match[4];
			}
		}
	}

	return useLocale;
}

/**
 * Bind a textdomain to a certain path. The catalog file will be searched
 * in `${path}/LOCALE/LC_MESSAGES/${domainname}.EXT`.
 *
 * @param domainname the textdomain to use, defaults to 'messages'
 * @param path the path where to search, defaults to '/assets/locale'
 *             for the web or 'assets/locale' for the file system.
 */
export function bindtextdomain(
	domainname?: string,
	path?: string,
): Promise<string> {
	if (typeof domainname === 'undefined' || domainname === '') {
		domainname = 'messages';
	}

	// FIXME! Check whether we already have the translations ...

	if (typeof path === 'undefined') {
		if (isBrowser) {
			path = '/assets/locale';
		} else {
			path = 'assets/locale';
		}
	}

	return new Promise((resolve) => {
		resolve(path);
	});
}

/**
 * Translate a simple string.
 *
 * @param msgid the string to translate
 *
 * @returns the translated string
 */
export function _(msgid: string): string {
	return msgid;
}

/**
 * Translate a string with placeholders.
 *
 * Placeholder names must begin with an ASCII alphabetic character (a-z, A-Z)
 * and can be followed by an arbitrary number of ASCII alphabetic characters
 * or ASCII digits (a-z, A-Z).
 *
 * @param msgid
 * @param placeholders
 */
export function _x(msgid: string, placeholders: Placeholder): string {
	return expand(msgid, placeholders);
}
