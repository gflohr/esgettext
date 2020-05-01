import { Textdomain } from './textdomain';
import { setLocale } from './set-locale';

describe('translation functions without catalog', () => {
	const gtx = Textdomain.getInstance('test');

	describe('normal gettext (_)', () => {
		it('should echo its argument', () => {
			expect(gtx._('foobar')).toEqual('foobar');
		});
	});

	describe('gettext with expansion (_x)', () => {
		it('should expand placeholders', () => {
			expect(gtx._x('Hello, {name}!', { name: 'world' })).toEqual(
				'Hello, world!',
			);
		});
		it('should preserve unknown placeholders', () => {
			expect(gtx._x('Hello, {name}!', {})).toEqual('Hello, {name}!');
		});
	});
});

describe('existing translations for locale de', () => {
	const gtx = Textdomain.getInstance('existing');

	beforeAll(() => {
		setLocale('de');
		return gtx.resolve();
	});

	describe('locale should be de indeed', () => {
		it('should use the locale de', () => {
			expect(setLocale()).toEqual('de');
		});
	});

	describe('normal strings', () => {
		it('should translate "December"', () => {
			expect(gtx._('December')).toEqual('Dezember');
		});

		it('should translate "September" to an identical string', () => {
			expect(gtx._('September')).toEqual('September');
		});

		it('should translate "January" to German not Austrian', () => {
			expect(gtx._('January')).toEqual('Januar');
		});

		it('should translate "February" to German not Austrian', () => {
			expect(gtx._('February')).toEqual('Februar');
		});
	});
});
