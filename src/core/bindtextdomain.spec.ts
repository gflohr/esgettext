import { setLocale } from './set-locale';
import { catalogFormat } from './catalog-format';
import { bindtextdomainImpl } from './bindtextdomain-impl';

// FIXME! Use the method, not the function!
describe('bindtextdomain', () => {
	setLocale('de');
	describe('simple test', () => {
		it('should return the default path for mytest.json', () => {
			catalogFormat('json');
			return bindtextdomainImpl('mytest').then((path) => {
				expect(path).toEqual('okay');
			});
		});
		it('should return the default path for mytest.mo', () => {
			catalogFormat('mo');
			return bindtextdomainImpl('mytest').then((path) => {
				expect(path).toEqual('okay');
			});
		});
	});
});
