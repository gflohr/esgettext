import { Catalog } from './catalog';

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
		return translations[0];
	}

	return args.msgid;
}
