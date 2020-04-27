import * as gtx from '../index';

/* eslint no-underscore-dangle: "off" */

describe('split locale', () => {
	describe('simple', () => {
		it('de', () => {
			expect(gtx.splitLocale('de')).toEqual({ tags: ['de'] });
		});
		it('de.utf-8', () => {
			expect(gtx.splitLocale('de.utf-8')).toEqual({
				tags: ['de'],
				charset: 'utf-8',
			});
		});
		it('de@koelsch', () => {
			expect(gtx.splitLocale('de@koelsch')).toEqual({
				tags: ['de'],
				modifier: 'koelsch',
			});
		});
		it('de.utf-8@koelsch', () => {
			expect(gtx.splitLocale('de.utf-8@koelsch')).toEqual({
				tags: ['de'],
				charset: 'utf-8',
				modifier: 'koelsch',
			});
		});
		it('de-DE@koelsch', () => {
			expect(gtx.splitLocale('de-DE@koelsch')).toEqual({
				tags: ['de', 'DE'],
				modifier: 'koelsch',
			});
		});
		it('de-DE.utf-8@koelsch', () => {
			expect(gtx.splitLocale('de-DE.utf-8@koelsch')).toEqual({
				tags: ['de', 'DE'],
				charset: 'utf-8',
				modifier: 'koelsch',
			});
		});
	});
});
