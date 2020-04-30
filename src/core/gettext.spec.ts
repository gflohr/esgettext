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

describe('existing translations for locale de_AT', () => {
	const gtx = Textdomain.getInstance('existing');

	beforeAll(() => {
		setLocale('de_AT');
		gtx.catalogFormat('mo');
		return gtx.resolve();
	});

	describe('locale should be de_AT indeed', () => {
		it('should use the locale de_AT', () => {
			expect(setLocale()).toEqual('de_AT');
		});
	});

	describe('normal strings', () => {
		it('should translate "December"', () => {
			expect(gtx._('December')).toEqual('Dezember');
		});

		it('should translate "September" to an identical string', () => {
			expect(gtx._('September')).toEqual('September');
		});

		it('should translate "January" to Austrian not German', () => {
			expect(gtx._('January')).toEqual('Jänner');
		});
	});
});
