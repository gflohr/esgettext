import { TranslationCatalogue } from '../translation-catalogue';

export interface CatalogueParser {
	/**
	 * Parses a binary file into a `TranslationCatalogue`.
	 *
	 * @param data - the raw input data
	 *
	 * @returns a `TranslationCatalogue`
	 */
	parse(data: Buffer, filename: string): TranslationCatalogue | null;
}
