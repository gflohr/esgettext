import * as gtx from './gtx/index';

gtx.browser(false);

describe('configuration functions', () => {
	describe('setLocale', () => {
		it('should convert DE to de', () => {
			expect(gtx.setLocale('DE')).toEqual('de');
		});
		it('should convert DE-de to de-DE', () => {
			expect(gtx.setLocale('DE-de')).toEqual('de-DE');
		});
		it('should convert DE-de@Koelsch to de-DE@Koelsch', () => {
			expect(gtx.setLocale('DE-de@Koelsch')).toEqual('de-DE@Koelsch');
		});
		it('should convert DE-de.uTf-8@Koelle to de-DE.uTf-8@Koelle', () => {
			expect(gtx.setLocale('DE-de.uTf-8@Koelsch')).toEqual('de-DE.uTf-8@Koelsch');
		});
	});
});
