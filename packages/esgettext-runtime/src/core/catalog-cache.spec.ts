import { CatalogCache } from './catalog-cache';

describe('catalog-cache', () => {
	const cache = CatalogCache.getInstance();

	describe('singleton', () => {
		it('should be a singleton', () => {
			expect(CatalogCache.getInstance() === cache).toBeTruthy();
		});
	});
});
