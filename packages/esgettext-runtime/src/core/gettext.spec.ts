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

describe('_x() (placeholder strings)', () => {
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
		it('should expand all placeholders', () => {
			expect(
				gtx._x('The colors are {color1}, {color2}, and {color3}.', {
					color1: gtx._('red'),
					color2: gtx._('green'),
					color3: gtx._('blue'),
				}),
			).toEqual('Die Farben sind Rot, Grün und Blau.');
		});

		it('should preserve undefined placeholders', () => {
			expect(
				gtx._x('The colors are {color1}, {color2}, and {color3}.', {
					color1: gtx._('red'),
					colorTypo: gtx._('green'),
					color3: gtx._('blue'),
				}),
			).toEqual('Die Farben sind Rot, {color2} und Blau.');
		});

		it('should ignore excess placeholders', () => {
			expect(
				gtx._x('The colors are {color1}, {color2}, and {color3}.', {
					color1: gtx._('red'),
					color2: gtx._('green'),
					color3: gtx._('blue'),
					color4: gtx._('brown'),
				}),
			).toEqual('Die Farben sind Rot, Grün und Blau.');
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

describe('_nx() (plural forms with placeholder expansion)', () => {
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
		it('should select the singular', () => {
			expect(
				gtx._nx(
					'One directory has been deleted.',
					'{num} directories have been deleted.',
					1,
					{ num: 1 },
				),
			).toEqual('Ein Verzeichnis wurde gelöscht.');
		});
		it('should select the singular', () => {
			expect(
				gtx._nx(
					'One directory has been deleted.',
					'{numDirs} directories have been deleted.',
					2304,
					{ num: 2304 },
				),
			).toEqual('2304 Verzeichnisse wurden gelöscht.');
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

describe('no-op methods', () => {
	const gtx = Textdomain.getInstance('test');

	describe('N_()', () => {
		it('the instance method should return the msgid', () => {
			expect(gtx.N_('one')).toEqual('one');
		});
		it('the class method should return the msgid', () => {
			expect(Textdomain.N_('one')).toEqual('one');
		});
	});

	describe('N_x()', () => {
		it('the instance method should return the expanded msgid', () => {
			expect(gtx.N_x('age: {age}', { age: 7 })).toEqual('age: 7');
		});
		it('the instance method should return the expanded msgid', () => {
			expect(gtx.N_x('age: {age}', { age: 7 })).toEqual('age: 7');
		});
	});

	describe('N_p()', () => {
		it('the instance method should return the msgid', () => {
			expect(gtx.N_p('whatever', 'one')).toEqual('one');
		});
		it('the class method should return the msgid', () => {
			expect(Textdomain.N_p('whatever', 'one')).toEqual('one');
		});
	});
});
