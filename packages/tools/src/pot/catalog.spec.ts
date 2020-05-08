import { Catalog } from './catalog';

describe('translation catalog', () => {
	describe('initialization', () => {
		it('should be initialized with zero configuration', () => {
			const defaultCatalog = new Catalog();

			expect(defaultCatalog.toString()).toMatchSnapshot();
		});
	});
});
