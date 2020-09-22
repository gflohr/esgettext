import { Textdomain } from './textdomain';
import { userLocales } from './user-locales';

describe('selectLocale()', () => {
	const supported = ['fi', 'de-DE', 'en-US', 'de-AT'];

	it ('should return "C" when not localized', () => {
		const requested = ['fr', 'en-US', 'de-DE'];
		userLocales(requested);
		expect(Textdomain.selectLocale([], requested)).toEqual('C');
	});

	it ('should return "C" for failure', () => {
		const requested = ['fr', 'it', 'es-ES'];
		// userLocales(requested);
		expect(Textdomain.selectLocale(supported, requested)).toEqual('C');
	});

	it('should find the first exact match', () => {
		const requested = ['fr', 'de-CH', 'en-US'];
		userLocales(requested);
		expect(Textdomain.selectLocale(supported, requested)).toEqual('en-US');
	});

	it('should use a language match', () => {
		const requested = ['fr', 'de-CH', 'it-IT'];
		userLocales(requested);
		expect(Textdomain.selectLocale(supported, requested)).toEqual('de-DE');
	});
});
