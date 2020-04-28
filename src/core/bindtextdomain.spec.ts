import { setLocale } from './set-locale';
import { catalogFormat } from './catalog-format';
import { Textdomain } from './textdomain';
import { CatalogCache } from './catalog-cache';

// FIXME! Use the method, not the function!
describe('bindtextdomain', () => {
	setLocale('de');
	beforeAll(() => CatalogCache.clear());

	describe('simple test', () => {
		const gtx = Textdomain.instance('mytest');

		it('should return something for mytest.json', () => {
			catalogFormat('json');
			return gtx.bindtextdomain().then((catalog) => {
				expect(catalog).toBeTruthy();
			});
		});

		it('should return something for mytest.mo', () => {
			const gtx = Textdomain.instance('mytest');

			catalogFormat('mo');
			return gtx.bindtextdomain().then((catalog) => {
				expect(catalog).toBeTruthy();
			});
		});

		it('should also return something for not-exists.mo', () => {
			const gtx = Textdomain.instance('not-exists');

			return gtx.bindtextdomain().then((catalog) => {
				expect(catalog).toBeTruthy();
			});
		});
	});
});
