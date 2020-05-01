import { Catalog } from '../core';

export interface CatalogParser {
	validate: (catalog: Catalog) => Catalog;
}
