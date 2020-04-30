import { splitLocale } from './split-locale';

/* eslint no-underscore-dangle: "off" */

describe('split locale', () => {
	describe('simple', () => {
		it('de', () => {
			expect(splitLocale('de')).toEqual({
				tags: ['de'],
				underscoreSeparator: false,
			});
		});
		it('de.utf-8', () => {
			expect(splitLocale('de.utf-8')).toEqual({
				tags: ['de'],
				underscoreSeparator: false,
				charset: 'utf-8',
			});
		});
		it('de@koelsch', () => {
			expect(splitLocale('de@koelsch')).toEqual({
				tags: ['de'],
				underscoreSeparator: false,
				modifier: 'koelsch',
			});
		});
		it('de.utf-8@koelsch', () => {
			expect(splitLocale('de.utf-8@koelsch')).toEqual({
				tags: ['de'],
				underscoreSeparator: false,
				charset: 'utf-8',
				modifier: 'koelsch',
			});
		});
		it('de_DE@koelsch', () => {
			expect(splitLocale('de_DE@koelsch')).toEqual({
				tags: ['de', 'DE'],
				underscoreSeparator: true,
				modifier: 'koelsch',
			});
		});
		it('de_DE.utf-8@koelsch', () => {
			expect(splitLocale('de_DE.utf-8@koelsch')).toEqual({
				tags: ['de', 'DE'],
				underscoreSeparator: true,
				charset: 'utf-8',
				modifier: 'koelsch',
			});
		});
	});
});
