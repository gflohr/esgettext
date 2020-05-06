const tagHyphenRegex = new RegExp('^[a-z0-9]+(?:-[a-z0-9]+)*$', 'i');
const tagUnderscoreRegex = new RegExp('^[a-z0-9]+(?:_[a-z0-9]+)*$', 'i');

export interface SplitLocale {
	tags: Array<string>;
	underscoreSeparator: boolean;
	charset?: string;
	modifier?: string;
}

export function splitLocale(locale: string): SplitLocale | null {
	let charset, modifier;

	const underscoreSeparator = locale.includes('_');

	locale = locale.replace(/@([a-z]+)$/i, (_, match) => {
		modifier = match;
		return '';
	});

	locale = locale.replace(/\.([-0-9a-z]+)$/i, (_, match) => {
		charset = match;
		return '';
	});

	if (underscoreSeparator) {
		if (!tagUnderscoreRegex.exec(locale)) {
			return null;
		}
	} else {
		if (!tagHyphenRegex.exec(locale)) {
			return null;
		}
	}

	const separator = underscoreSeparator ? '_' : '-';
	const tags = locale.split(separator);

	const split: SplitLocale = { tags: tags, underscoreSeparator };

	if (typeof charset !== 'undefined') {
		split.charset = charset;
	}

	if (typeof modifier !== 'undefined') {
		split.modifier = modifier;
	}

	return split;
}
