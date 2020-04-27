import * as gtx from '../gtx';
import { setLocale } from './set-locale';
import { format } from './format';

describe('bindtextdomain', () => {
	setLocale('de');
	describe('simple test', () => {
		it('should return the default path for mytest.json', () => {
			format('json');
			return gtx.bindtextdomain('mytest').then((path) => {
				expect(path).toEqual('okay');
			});
		});
		it('should return the default path for mytest.mo', () => {
			format('mo');
			return gtx.bindtextdomain('mytest').then((path) => {
				expect(path).toEqual('okay');
			});
		});
	});
});
