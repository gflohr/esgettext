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

describe('existing translations for locale de_AT', () => {
	const gtx = Textdomain.getInstance('existing');

	beforeAll(() => {
		setLocale('de_AT');
		return gtx.resolve();
	});

	describe('locale should be de indeed', () => {
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

		it('should translate "February" to Austrian not German', () => {
			expect(gtx._('February')).toEqual('Feber');
		});
	});
});

describe('_n() (plural forms)', () => {
	const gtx = Textdomain.getInstance('existing');

	beforeAll(() => {
		setLocale('de_AT');
		return gtx.resolve();
	});

	describe('locale should be de indeed', () => {
		it('should use the locale de_AT', () => {
			expect(setLocale()).toEqual('de_AT');
		});
	});

	describe('tests', () => {
		it('should select the plural', () => {
			expect(gtx._n('Singular', 'Plural', 0)).toEqual('Mehrzahl');
		});
		it('should select the singular', () => {
			expect(gtx._n('Singular', 'Plural', 1)).toEqual('Einzahl');
		});
		it('should select the plural', () => {
			expect(gtx._n('Singular', 'Plural', 2)).toEqual('Mehrzahl');
		});
	});
});

describe('_p() (with context)', () => {
	const gtx = Textdomain.getInstance('existing');

	beforeAll(() => {
		setLocale('de_AT');
		return gtx.resolve();
	});

	describe('locale should be de indeed', () => {
		it('should use the locale de_AT', () => {
			expect(setLocale()).toEqual('de_AT');
		});
	});

	describe('tests', () => {
		it('should select no context', () => {
			expect(gtx._('View')).toEqual('Anzeigen');
		});

		it('should select the 1st context', () => {
			expect(gtx._p('Which folder would you like to view?', 'View')).toEqual(
				'Ansicht',
			);
		});

		it('should select the 2nd context', () => {
			expect(
				gtx._p('Which folder would you like to view? (2)', 'View'),
			).toEqual('View 2');
		});
	});
});
