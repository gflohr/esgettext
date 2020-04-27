import { browserEnvironment, setLocale } from './index';

browserEnvironment(true);

describe('configuration functions', () => {
	describe('setLocale', () => {
		it('should accept dE-aT for the web and return it unmodified', () => {
			expect(setLocale('dE-aT')).toEqual('dE-aT');
		});
		it('should recect -fR-fR for the web and return it unmodified', () => {
			expect(setLocale('-fR-fR')).toEqual('dE-aT');
		});
	});
});
