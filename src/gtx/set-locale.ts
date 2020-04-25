import { browser } from './browser';

let useLocale = 'POSIX';
const browserLocaleRegex = new RegExp('^[a-z0-9]+(?:-[a-z0-9]+)*', 'i');
const nodeLocaleRegex = new RegExp(
	'^([a-z]{2,3})(?:-([a-z]{2}))?(?:@([a-z]+))?(?:.([-a-z0-9]+))?$',
	'i',
);

/**
 * Change or query the locale.
 *
 * For the web you can all valid language identifier tags that BCP47 allows
 * (and actually a lot more). The tag is always used unmodified.
 *
 * For server environments, the locale identifier has to match the following
 * scheme:
 *
 *   ll-CC@variant.charset
 *
 * `ll` is the two- or three-letter language code.
 * `CC` is the optionl two-letter country code.
 * `variant` is an optional variant (letters and digits).
 * `charset` is an optional character set (letters, digits, and the hyphen).
 *
 * The language code is always converted to lowercase, the country code is
 * converted to uppercase, variant and charset are used as is.
 *
 * @param locale the locale identifier
 * @returns the locale in use
 */
export function setLocale(locale?: string): string {
	const ucLocale = locale.toUpperCase();

	if (typeof locale !== 'undefined') {
		if (ucLocale === 'POSIX' || ucLocale === 'C') {
			useLocale = ucLocale;
		} else if (browser() && browserLocaleRegex.exec(locale)) {
			useLocale = locale;
		} else if (!browser()) {
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
	}

	return useLocale;
}
