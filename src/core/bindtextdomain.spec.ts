import { setLocale } from './set-locale';
import { catalogFormat } from './catalog-format';
import { Textdomain } from './textdomain';

// FIXME! Use the method, not the function!
describe('bindtextdomain', () => {
	const gtx = Textdomain.instance('mytest');

	setLocale('de');
	describe('simple test', () => {
		it('should return the default path for mytest.json', () => {
			catalogFormat('json');
			return gtx.bindtextdomain().then((path) => {
				expect(path).toEqual('okay');
			});
		});
		it('should return the default path for mytest.mo', () => {
			catalogFormat('mo');
			return gtx.bindtextdomain().then((path) => {
				expect(path).toEqual('okay');
			});
		});
	});
});
