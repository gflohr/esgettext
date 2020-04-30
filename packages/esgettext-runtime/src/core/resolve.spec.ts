import { setLocale } from './set-locale';
import { Textdomain } from './textdomain';
import { CatalogCache } from './catalog-cache';

// FIXME! Use the method, not the function!
describe('resolve', () => {
	setLocale('de');
	beforeAll(() => CatalogCache.clear());

	describe('simple test', () => {
		const gtx = Textdomain.getInstance('mytest');

		it('should return something for mytest.json', () => {
			gtx.catalogFormat('json');
			return gtx.resolve().then((catalog) => {
				expect(catalog).toBeTruthy();
			});
		});

		it('should return something for mytest.mo', () => {
			const gtx = Textdomain.getInstance('mytest');

			gtx.catalogFormat('mo');
			return gtx.resolve().then((catalog) => {
				expect(catalog).toBeTruthy();
			});
		});

		it('should also return something for not-exists.mo', () => {
			const gtx = Textdomain.getInstance('not-exists');

			return gtx.resolve().then((catalog) => {
				expect(catalog).toBeTruthy();
			});
		});
	});
});
