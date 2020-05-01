import { Catalog } from '../core';

export interface CatalogValidator {
	validate: (catalog: Catalog) => Catalog;
}
