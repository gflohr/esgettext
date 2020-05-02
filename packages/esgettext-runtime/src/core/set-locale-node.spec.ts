import { browserEnvironment } from './browser-environment';
import { setLocale } from './set-locale';

browserEnvironment(false);

describe('configuration functions', () => {
	describe('setLocale', () => {
		it('should convert DE to de', () => {
			expect(setLocale('DE')).toEqual('de');
		});
		it('should convert DE_de to de_DE', () => {
			expect(setLocale('DE_de')).toEqual('de_DE');
		});
		it('should convert DE_de@Koelsch to de_DE@Koelsch', () => {
			expect(setLocale('DE_de@Koelsch')).toEqual('de_DE@Koelsch');
		});
		it('should convert DE_de.uTf-8@Koelle to de_DE.uTf-8@Koelle', () => {
			expect(setLocale('DE_de.uTf-8@Koelsch')).toEqual('de_DE.uTf-8@Koelsch');
		});
	});
});
