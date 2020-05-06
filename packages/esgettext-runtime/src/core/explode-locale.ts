import { SplitLocale } from './split-locale';

type ExplodedLocale = Array<Array<string>>;

export function explodeLocale(locale: SplitLocale): ExplodedLocale {
	const retval: ExplodedLocale = [];
	const lsep = locale.underscoreSeparator ? '_' : '-';

	for (let i = 0; i < locale.tags.length; ++i) {
		const lingua = locale.tags.slice(0, i + 1).join(lsep);
		retval.push([lingua]);
	}

	return retval;
}
