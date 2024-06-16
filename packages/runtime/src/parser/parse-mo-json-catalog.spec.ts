import { Catalog, CatalogEntries } from '../core';
import { validateMoJsonCatalog } from './parse-mo-json-catalog';

describe('parse JSON catalogs', () => {
	describe('validate', () => {
		it('should reject undefined catalogs', () => {
			expect(() => validateMoJsonCatalog(undefined)).toThrow(
				'catalog is either null or undefined',
			);
		});
		it('should reject arrays', () => {
			const arr = new Array<string>() as unknown as Catalog;
			expect(() => validateMoJsonCatalog(arr)).toThrow(
				'catalog must be a dictionary',
			);
		});
		it('should reject catalogs without entries', () => {
			const catalog = {
				major: 0,
				minor: 0,
			} as Catalog;
			expect(() => validateMoJsonCatalog(catalog)).toThrow(
				'catalog.entries does not exist',
			);
		});
		it('should reject catalogs without entries', () => {
			const arr = new Array<string>() as unknown as CatalogEntries;
			const catalog = {
				major: 0,
				minor: 0,
				entries: arr,
			} as Catalog;
			expect(() => validateMoJsonCatalog(catalog)).toThrow(
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
			expect(() => validateMoJsonCatalog(catalog)).toThrow(
				"catalog entry for key 'Saturday' is not an array",
			);
		});
	});
});
