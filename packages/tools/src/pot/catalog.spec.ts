import { Catalog } from './catalog';

const date = '2020-04-23 08:50+0300';

describe('translation catalog', () => {
	describe('initialization', () => {
		it('should be initialized with zero configuration', () => {
			const defaultCatalog = new Catalog({ date });
			expect(defaultCatalog.toString()).toMatchSnapshot();
		});

		it('should honor the foreignUser flag', () => {
			const defaultCatalog = new Catalog({ date, foreignUser: true });
			expect(defaultCatalog.toString()).toMatchSnapshot();
		});
	});
});
