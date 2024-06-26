import { SplitLocale, splitLocale } from './split-locale';
import { explodeLocale } from './explode-locale';

describe('explode locale', () => {
	describe('web', () => {
		it('de', () => {
			const paths = explodeLocale(splitLocale('de') as SplitLocale);
			expect(paths).toEqual([['de']]);
		});
		it('de-at', () => {
			const paths = explodeLocale(splitLocale('de-at') as SplitLocale);
			expect(paths).toEqual([['de-at']]);
		});
	});

	describe('server', () => {
		it('de_DE', () => {
			const paths = explodeLocale(splitLocale('de_DE') as SplitLocale, true);
			expect(paths).toEqual([['de'], ['de_DE']]);
		});
		it('de_DE@ksh', () => {
			const paths = explodeLocale(
				splitLocale('de_DE@ksh') as SplitLocale,
				true,
			);
			expect(paths).toEqual([['de@ksh'], ['de_DE@ksh']]);
		});
		it('de_DE.UTF-8@ksh', () => {
			const paths = explodeLocale(
				splitLocale('de_DE.UTF-8@ksh') as SplitLocale,
				true,
			);
			expect(paths).toEqual([
				['de.UTF-8@ksh', 'de@ksh'],
				['de_DE.UTF-8@ksh', 'de_DE@ksh'],
			]);
		});
		it('de_DE.utf-8@ksh', () => {
			const paths = explodeLocale(
				splitLocale('de_DE.utf-8@ksh') as SplitLocale,
				true,
			);
			expect(paths).toEqual([
				['de.utf-8@ksh', 'de.UTF-8@ksh', 'de@ksh'],
				['de_DE.utf-8@ksh', 'de_DE.UTF-8@ksh', 'de_DE@ksh'],
			]);
		});
	});
});
