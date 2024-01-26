import { Textdomain } from './textdomain';
import { userLocales } from './user-locales';

describe('textdomain', () => {
	describe('getInstance()', () => {
		it('empty textdomain should throw an exception', () => {
			expect(() => Textdomain.getInstance('')).toThrow();
		});
		it('null textdomain should throw an exception', () => {
			expect(() => Textdomain.getInstance(null as unknown as string)).toThrow();
		});
		it('undefined textdomain should throw an exception', () => {
			expect(() => Textdomain.getInstance(undefined as unknown as string)).toThrow();
		});
	});
	describe('clearInstances()', () => {
		it('clearInstances() should work', () => {
			expect(() => Textdomain.clearInstances()).not.toThrow();
		});
	});
	describe('textdomain()', () => {
		const gtx = Textdomain.getInstance('messages');
		expect(gtx.textdomain()).toEqual('messages');
	});
	describe('userLocales()', () => {
		const locales = ['fi', 'de-DE', 'en-US'];
		userLocales(locales);
		expect(Textdomain.userLocales()).toEqual(locales);
	});
	describe('bindtextdomain() with object', () => {});
});
