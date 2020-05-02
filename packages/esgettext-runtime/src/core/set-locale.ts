import { browserEnvironment } from './browser-environment';
import { splitLocale } from './split-locale';

let useLocale = 'POSIX';

/**
 * Change or query the locale.
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
export function setLocale(locale?: string): string {
	if (typeof locale !== 'undefined') {
		const ucLocale = locale.toUpperCase();

		if (ucLocale === 'POSIX' || ucLocale === 'C') {
			useLocale = 'POSIX';
			return ucLocale;
		}

		const split = splitLocale(locale);
		if (!split) {
			return useLocale;
		}

		// The check from splitLocale() is sufficient.
		if (browserEnvironment()) {
			useLocale = locale;
			return useLocale;
		}

		// Node.
		split.tags[0] = split.tags[0].toLowerCase();
		if (split.tags.length > 1) {
			split.tags[1] = split.tags[1].toUpperCase();
		}

		const separator = split.underscoreSeparator ? '_' : '-';
		useLocale = split.tags.join(separator);

		if (typeof split.charset !== 'undefined') {
			useLocale += '.' + split.charset;
		}

		if (typeof split.modifier !== 'undefined') {
			useLocale += '@' + split.modifier;
		}
	}

	return useLocale;
}
