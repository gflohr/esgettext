import { Catalog } from './catalog';

const date = '2020-04-23 08:50+0300';

describe('translation catalog', () => {
	describe('initialization', () => {
		it('should be initialized with zero configuration', () => {
			const defaultCatalog = new Catalog();
			expect(defaultCatalog.toString()).toMatch(/Content-Type/);
		});

		it('should be initialized with default values', () => {
			const defaultCatalog = new Catalog({ date });
			expect(defaultCatalog.toString()).toMatchSnapshot();
		});

		it('should honor the foreign-user option', () => {
			const defaultCatalog = new Catalog({ date, foreignUser: true });
			expect(defaultCatalog.toString()).toMatchSnapshot();
		});

		it('should honor the package option', () => {
			const defaultCatalog = new Catalog({ date, package: 'foobar' });
			expect(defaultCatalog.toString()).toMatchSnapshot();
		});

		it('should honor the version option', () => {
			const defaultCatalog = new Catalog({ date, version: '23.4.89' });
			expect(defaultCatalog.toString()).toMatchSnapshot();
		});

		it('should honor the msgid-bugs-address option', () => {
			const defaultCatalog = new Catalog({
				date,
				msgidBugsAddress: 'me@example.com',
			});
			expect(defaultCatalog.toString()).toMatchSnapshot();
		});

		it('should honor the from-code option', () => {
			const defaultCatalog = new Catalog({ date, fromCode: 'utf-8' });
			expect(defaultCatalog.toString()).toMatchSnapshot();
		});
	});
});
