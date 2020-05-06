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
		it('de_AT', () => {
			const paths = explodeLocale(splitLocale('de_AT'));
			expect(paths).toEqual([['de'], ['de_AT']]);
		});
	});
});
