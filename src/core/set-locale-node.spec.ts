import { browserEnvironment, setLocale } from './index';

browserEnvironment(false);

describe('configuration functions', () => {
	describe('setLocale', () => {
		it('should convert DE to de', () => {
			expect(setLocale('DE')).toEqual('de');
		});
		it('should convert DE-de to de-DE', () => {
			expect(setLocale('DE-de')).toEqual('de-DE');
		});
		it('should convert DE-de@Koelsch to de-DE@Koelsch', () => {
			expect(setLocale('DE-de@Koelsch')).toEqual('de-DE@Koelsch');
		});
		it('should convert DE-de.uTf-8@Koelle to de-DE.uTf-8@Koelle', () => {
			expect(setLocale('DE-de.uTf-8@Koelsch')).toEqual('de-DE.uTf-8@Koelsch');
		});
	});
});
