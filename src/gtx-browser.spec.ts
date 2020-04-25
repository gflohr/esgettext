import * as gtx from './gtx';

gtx.useBrowser(true);
describe('configuration functions', () => {
	describe('setLocale', () => {
		it('should accept dE-aT for the web and return it unmodified', () => {
			expect(gtx.setLocale('dE-aT')).toEqual('dE-aT');
		});
		it('should recect -fR-fR for the web and return it unmodified', () => {
			expect(gtx.setLocale('-fR-fR')).toEqual('dE-aT');
		});
	});
});
