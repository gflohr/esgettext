import { splitLocale } from './split-locale';

function tagsEqual(left: Array<string>, right: Array<string>): boolean {
	if (left.length !== right.length) {
		return false;
	}

	for (let i = 0; i < left.length; ++i) {
		if (left[i].toLowerCase() !== right[i].toLowerCase()) {
			return false;
		}
	}

	return true;
}

export function selectLocale(
	supported: Array<string>,
	requested: Array<string>,
): string {
	let languageMatch: string;

	for (let i = 0; i < requested.length; ++i) {
		const wanted = splitLocale(requested[i]);
		if (!wanted) {
			continue;
		}

		for (let j = 0; j < supported.length; ++j) {
			const got = splitLocale(supported[j]);
			if (!got) {
				continue;
			}

			if (tagsEqual(wanted.tags, got.tags)) {
				return supported[j];
			}

			if (
				typeof languageMatch === 'undefined' &&
				wanted.tags[0].toLowerCase() === got.tags[0].toLowerCase()
			) {
				languageMatch = supported[j];
			}
		}
	}

	if (typeof languageMatch !== 'undefined') {
		return languageMatch;
	}

	return 'C';
}
