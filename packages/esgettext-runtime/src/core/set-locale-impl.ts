import { browserEnvironment } from './browser-environment';
import { splitLocale } from './split-locale';

let useLocale = 'POSIX';

export function setLocaleImpl(locale?: string): string {
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
