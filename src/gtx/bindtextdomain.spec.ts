import * as gtx from '../gtx';
import { setLocale } from './set-locale';

describe('bindtextdomain', () => {
	setLocale('de');
	describe('simple test', () => {
		it('should return the default path for mytest', () => {
			return gtx.bindtextdomain('mytest').then((path) => {
				expect(path).toEqual('src/assets/locale/POSIX/LC_MESSAGES/mytest.json');
			});
		});
	});
});
