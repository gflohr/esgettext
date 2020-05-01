import { Catalog } from '../core';

export interface CatalogParser {
	parse: (buffer: ArrayBuffer) => Catalog;
}
