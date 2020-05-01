import { Catalog } from './catalog';

interface GettextImplArgs {
	msgid: string;
	catalog: Catalog;
	msgidPlural?: string;
	numItems?: number;
	context?: string;
}

export function gettextImpl(args: GettextImplArgs): string {
	const translations = args.catalog.entries[args.msgid];

	if (translations && translations.length) {
		return translations[0];
	}

	return args.msgid;
}
