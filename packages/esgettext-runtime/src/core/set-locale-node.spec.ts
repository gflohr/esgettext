import { browserEnvironment } from './browser-environment';
import { Textdomain } from './textdomain';

browserEnvironment(false);

describe('configuration functions', () => {
	describe('setLocale', () => {
		it('should convert DE to de', () => {
			Textdomain.locale = 'DE';
			expect(Textdomain.locale).toEqual('de');
		});
		it('should convert DE_de to de_DE', () => {
			Textdomain.locale = 'DE_de';
			expect(Textdomain.locale).toEqual('de_DE');
		});
		it('should convert DE_de@Koelsch to de_DE@Koelsch', () => {
			Textdomain.locale = 'DE_de@Koelsch';
			expect(Textdomain.locale).toEqual('de_DE@Koelsch');
		});
		it('should convert DE_de.uTf-8@Koelle to de_DE.uTf-8@Koelle', () => {
			Textdomain.locale = 'DE_de.uTf-8@Koelsch';
			expect(Textdomain.locale).toEqual('de_DE.uTf-8@Koelsch');
		});
	});
});
