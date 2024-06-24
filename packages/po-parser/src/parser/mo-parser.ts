import { parseMoCatalog } from "@esgettext/runtime";
import { CatalogueParser } from ".";
import { PoEntry, TranslationCatalogue } from "../translation-catalogue";

const ctxtSeparator = '\u0004';

/**
 * A `MoParser` is able to parse binary mo files into a ???
 */
export class MoParser implements CatalogueParser {
	parse(data: ArrayBuffer): TranslationCatalogue {
		const raw = parseMoCatalog(data);
		const catalogue = new TranslationCatalogue();

		for (const key in raw.entries) {
			const [msgid, msgctxt] = key.split(ctxtSeparator, 2);

			const entry = new PoEntry({
				msgid: msgid,
				msgctxt: msgctxt,
				msgstr: raw.entries[key],
			}, true);


			catalogue.addEntry(entry);
		}

		return catalogue;
	}
}
