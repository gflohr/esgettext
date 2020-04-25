import * as gtx from './gtx';

gtx.useBrowser(false);

describe('configuration functions', () => {
	describe('setLocale', () => {
		it('should convert DE to de', () => {
			expect(gtx.setLocale('DE')).toEqual('de');
		});
		it('should convert DE-de to de-DE', () => {
			expect(gtx.setLocale('DE-de')).toEqual('de-DE');
		});
		it('should convert DE-de@Koelle to de-DE@Koelle', () => {
			expect(gtx.setLocale('DE-de@Koelle')).toEqual('de-DE@Koelle');
		});
		it('should convert DE-de@Koelle.uTf-8 to de-DE@Koelle.uTf-8', () => {
			expect(gtx.setLocale('DE-de@Koelle.uTf-8')).toEqual('de-DE@Koelle.uTf-8');
		});
	});
});
