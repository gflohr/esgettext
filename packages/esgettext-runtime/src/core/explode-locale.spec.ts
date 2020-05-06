import { splitLocale } from './split-locale';
import { explodeLocale } from './explode-locale';

describe('explode locale', () => {
	describe('web', () => {
		it('de', () => {
			const paths = explodeLocale(splitLocale('de'));
			expect(paths).toEqual([['de']]);
		});
	});

	describe('server', () => {
		it('de_DE', () => {
			const paths = explodeLocale(splitLocale('de_DE'));
			expect(paths).toEqual([['de'], ['de_DE']]);
		});
		it('de_DE@ksh', () => {
			const paths = explodeLocale(splitLocale('de_DE@ksh'));
			expect(paths).toEqual([['de@ksh'], ['de_DE@ksh']]);
		});
	});
});
