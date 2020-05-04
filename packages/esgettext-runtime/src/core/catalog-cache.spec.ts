import { CatalogCache } from '../../lib';

describe('catalog-cache', () => {
	const cache = CatalogCache.getInstance();

	describe('singleton', () => {
		it('should be a singleton', () => {
			expect(CatalogCache.getInstance() === cache).toBeTruthy();
		});
	});
});
