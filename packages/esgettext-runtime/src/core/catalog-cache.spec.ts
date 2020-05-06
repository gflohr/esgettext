import { CatalogCache } from './catalog-cache';
import { germanicPlural } from './germanic-plural';
import { Catalog } from './catalog';

describe('catalog-cache', () => {
	const cache = CatalogCache.getInstance();

	describe('singleton', () => {
		it('should be a singleton', () => {
			expect(CatalogCache.getInstance() === cache).toBeTruthy();
		});
		it('should return null for non-existing catalogs', () => {
			const catalog: Catalog = {
				major: 0,
				minor: 0,
				pluralFunction: germanicPlural,
				entries: {},
			};
			CatalogCache.store('xy', 'once', catalog);
			expect(CatalogCache.lookup('xy', 'once')).toBeDefined();
			expect(CatalogCache.lookup('xy', 'twice')).toBeNull();
		});
	});
});
