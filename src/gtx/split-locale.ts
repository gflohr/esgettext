const tagRegex = new RegExp('^[a-z0-9]+(?:-[a-z0-9]+)*$', 'i');

interface SplitLocale {
	tags: Array<string>;
	charset?: string;
	modifier?: string;
}

export function splitLocale(locale: string): SplitLocale | null {
	let charset, modifier;

	locale = locale.replace(/@([a-z]+)$/i, (_, match) => {
		modifier = match;
		return '';
	});

	locale = locale.replace(/\.([-0-9a-z]+)$/i, (_, match) => {
		charset = match;
		return '';
	});

	if (!tagRegex.exec(locale)) {
		return null;
	}

	const tags = locale.split('-');
	if (!tags.length) {
		return null;
	}
	const empty = tags.filter(value => value === '');
	if (empty.length) {
		return null;
	}

	const split: SplitLocale = { tags: tags };

	if (typeof charset !== 'undefined') {
		split.charset = charset;
	}

	if (typeof modifier !== 'undefined') {
		split.modifier = modifier;
	}

	return split;
}
