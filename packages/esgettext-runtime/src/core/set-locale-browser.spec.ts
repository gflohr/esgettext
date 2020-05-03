import { browserEnvironment } from './browser-environment';
import { Textdomain } from './textdomain';

browserEnvironment(true);

describe('configuration functions', () => {
	describe('setLocale', () => {
		it('should accept dE-aT for the web and return it unmodified', () => {
			expect(Textdomain.setLocale('dE-aT')).toEqual('dE-aT');
		});
		it('should recect -fR-fR for the web and return it unmodified', () => {
			expect(Textdomain.setLocale('-fR-fR')).toEqual('dE-aT');
		});
	});
});
