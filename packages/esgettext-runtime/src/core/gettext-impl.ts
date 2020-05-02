import { Catalog } from './catalog';
import { germanicPlural } from './germanic-plural';

interface GettextImplArgs {
	msgid: string;
	catalog: Catalog;
	msgidPlural?: string;
	numItems?: number;
	msgctxt?: string;
}

export function gettextImpl(args: GettextImplArgs): string {
	const key =
		typeof args.msgctxt === 'undefined'
			? args.msgid
			: args.msgctxt + '\u0004' + args.msgid;
	const translations = args.catalog.entries[key];

	if (translations && translations.length) {
		if (typeof args.msgidPlural === 'undefined') {
			return translations[0];
		} else {
			let pluralForm = args.catalog.pluralFunction(args.numItems);
			if (pluralForm >= translations.length) {
				if (translations.length === 1) {
					return translations[0];
				} else {
					pluralForm = germanicPlural(args.numItems);
				}
			}
			return translations[pluralForm];
		}
	}

	return key;
}
