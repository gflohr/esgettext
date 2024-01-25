import { Catalog, CatalogEntries } from '../core';
import { validateJsonCatalog } from './parse-json-catalog';

describe('parse JSON catalogs', () => {
	describe('validate', () => {
		it('should reject undefined catalogs', () => {
			expect(() => validateJsonCatalog(undefined)).toThrow(
				'catalog is not defined',
			);
		});
		it('should reject arrays', () => {
			const arr = new Array<string>() as unknown as Catalog;
			expect(() => validateJsonCatalog(arr)).toThrow(
				'catalog must be a dictionary',
			);
		});
		it('should reject catalogs without entries', () => {
			const catalog = {
				major: 0,
				minor: 0,
			} as Catalog;
			expect(() => validateJsonCatalog(catalog)).toThrow(
				'catalog.entries is not defined',
			);
		});
		it('should reject catalogs without entries', () => {
			const arr = new Array<string>() as unknown as CatalogEntries;
			const catalog = {
				major: 0,
				minor: 0,
				entries: arr,
			} as Catalog;
			expect(() => validateJsonCatalog(catalog)).toThrow(
				'catalog.entries must be a dictionary',
			);
		});
		it('should reject entries whose values are not arrays', () => {
			const catalog = {
				major: 0,
				minor: 0,
				entries: {
					Saturday: 'Lauantai',
				},
			} as unknown as Catalog;
			expect(() => validateJsonCatalog(catalog)).toThrow(
				"catalog entry for key 'Saturday' is not an array",
			);
		});
	});
});
