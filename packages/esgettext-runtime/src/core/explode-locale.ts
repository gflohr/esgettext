import { SplitLocale } from './split-locale';

export type ExplodedLocale = Array<Array<string>>;

export function explodeLocale(
	locale: SplitLocale,
	vary?: boolean,
): ExplodedLocale {
	const retval: ExplodedLocale = [];
	const lsep = locale.underscoreSeparator ? '_' : '-';
	let i = vary ? 0 : locale.tags.length - 1;
	const hasCharset = typeof locale.charset !== 'undefined';
	const hasModifier = typeof locale.modifier !== 'undefined';

	const charsets = hasCharset ? [locale.charset] : [''];
	if (vary && hasCharset) {
		const ucCharset = locale.charset.toUpperCase();
		if (ucCharset !== locale.charset) {
			charsets.push(ucCharset);
		}
		charsets.push('');
	}

	for (; i < locale.tags.length; ++i) {
		const lingua = locale.tags.slice(0, i + 1).join(lsep);
		const ids = new Array<string>();

		charsets.forEach(charset => {
			let id = charset.length ? lingua + '.' + charset : lingua;
			if (hasModifier) {
				id += '@' + locale.modifier;
			}
			ids.push(id);
		});
		retval.push(ids);
	}

	return retval;
}
