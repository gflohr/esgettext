import { browserEnvironment } from './browser-environment';
import { Textdomain } from './textdomain';

browserEnvironment(true);

describe('configuration functions', () => {
	describe('setLocale', () => {
		it('should accept dE-aT for the web and return it unmodified', () => {
			Textdomain.locale = 'dE-aT';
			expect(Textdomain.locale).toEqual('dE-aT');
		});
		it('should reject -fR-fR', () => {
			expect(() => (Textdomain.locale = '-fR-fR')).toThrow();
		});
	});
});
