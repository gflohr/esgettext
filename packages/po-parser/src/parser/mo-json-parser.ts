import { parseMoJsonCatalog } from '@esgettext/runtime';
import { CatalogueParser } from './catalogue-parser';
import { PoEntry, TranslationCatalogue } from '../translation-catalogue';

const ctxtSeparator = '\u0004';

/**
 * A `MoParser` is able to parse binary mo files into a ???
 */
export class MoJsonParser implements CatalogueParser {
	parse(data: Buffer | string): TranslationCatalogue {
		const input = typeof data === 'string' ? Buffer.from(data) : data;
		const raw = parseMoJsonCatalog(input);
		const catalogue = new TranslationCatalogue();

		for (const key in raw.entries) {
			const fields = key.split(ctxtSeparator, 2);
			const [msgid, msgctxt] =
				fields.length === 1 ? [fields[0]] : [fields[1], fields[0]];

			const entry = new PoEntry({
				msgid: msgid,
				msgctxt: msgctxt,
				msgstr: raw.entries[key],
			});

			catalogue.addEntry(entry);
		}

		return catalogue;
	}
}
