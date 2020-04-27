import { setLocale } from './set-locale';
import { catalogFormat } from './catalog-format';
import { bindtextdomain } from './bindtextdomain';

describe('bindtextdomain', () => {
	setLocale('de');
	describe('simple test', () => {
		it('should return the default path for mytest.json', () => {
			catalogFormat('json');
			return bindtextdomain('mytest').then((path) => {
				expect(path).toEqual('okay');
			});
		});
		it('should return the default path for mytest.mo', () => {
			catalogFormat('mo');
			return bindtextdomain('mytest').then((path) => {
				expect(path).toEqual('okay');
			});
		});
	});
});
