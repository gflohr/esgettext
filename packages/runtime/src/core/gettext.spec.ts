import { Textdomain } from './textdomain';
import type { Catalog } from './catalog';
import { gettextImpl } from './gettext-impl';

const localeDir = 'src/locale';

describe('translation functions without catalog', () => {
	const gtx = Textdomain.getInstance('test');
	gtx.bindtextdomain(localeDir);

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
	gtx.bindtextdomain(localeDir);

	beforeAll(() => {
		Textdomain.locale = 'de';
		return gtx.resolve();
	});

	describe('locale should be de indeed', () => {
		it('should use the locale de', () => {
			expect(Textdomain.locale).toEqual('de');
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

describe('translations from multiple packages de', () => {
	const gtx1 = Textdomain.getInstance('existing');
	gtx1.bindtextdomain(localeDir);
	const gtx2 = Textdomain.getInstance('additional');
	gtx2.bindtextdomain(localeDir);

	beforeAll(() => {
		Textdomain.locale = 'de';
		// This should also resolve gtx2.
		return gtx1.resolve();
	});

	describe('locale should be de indeed', () => {
		it('should use the locale de', () => {
			expect(Textdomain.locale).toEqual('de');
		});
	});

	describe('normal strings', () => {
		it('should translate "January" from first domain', () => {
			expect(gtx1._('January')).toEqual('Januar');
		});

		it('should translate "Saturday" from second domain', () => {
			expect(gtx2._('Saturday')).toEqual('Samstag');
		});
	});
});

describe('existing translations for locale de_AT', () => {
	const gtx = Textdomain.getInstance('existing');
	gtx.bindtextdomain(localeDir);

	beforeAll(() => {
		Textdomain.locale = 'de_AT';
		return gtx.resolve();
	});

	describe('locale should be de_AT indeed', () => {
		it('should use the locale de_AT', () => {
			expect(Textdomain.locale).toEqual('de_AT');
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
	gtx.bindtextdomain(localeDir);

	beforeAll(() => {
		Textdomain.locale = 'de_AT';
		return gtx.resolve();
	});

	describe('locale should be de_AT indeed', () => {
		it('should use the locale de_AT', () => {
			expect(Textdomain.locale).toEqual('de_AT');
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
	gtx.bindtextdomain(localeDir);

	beforeAll(() => {
		Textdomain.locale = 'de_AT';
		return gtx.resolve();
	});

	describe('locale should be de_AT indeed', () => {
		it('should use the locale de_AT', () => {
			expect(Textdomain.locale).toEqual('de_AT');
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
	gtx.bindtextdomain(localeDir);

	beforeAll(() => {
		Textdomain.locale = 'de_AT';
		return gtx.resolve();
	});

	describe('locale should be de_AT indeed', () => {
		it('should use the locale de_AT', () => {
			expect(Textdomain.locale).toEqual('de_AT');
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
		it('should work without placeholders', () => {
			expect(
				gtx._nx(
					'One directory has been deleted.',
					'{numDirs} directories have been deleted.',
					2304,
				),
			).toEqual('{num} Verzeichnisse wurden gelöscht.');
		});
	});
});

describe('_p() (with context)', () => {
	const gtx = Textdomain.getInstance('existing');
	gtx.bindtextdomain(localeDir);

	beforeAll(() => {
		Textdomain.locale = 'de_AT';
		return gtx.resolve();
	});

	describe('locale should be de_AT indeed', () => {
		it('should use the locale de_AT', () => {
			expect(Textdomain.locale).toEqual('de_AT');
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

		it('should use the original string for unknown contexts', () => {
			expect(gtx._p('gips.net', 'View')).toEqual('View');
		});
	});
});

describe('_px() (with context and placeholders)', () => {
	const gtx = Textdomain.getInstance('existing');
	gtx.bindtextdomain(localeDir);

	beforeAll(() => {
		Textdomain.locale = 'de_AT';
		return gtx.resolve();
	});

	describe('locale should be de_AT indeed', () => {
		it('should use the locale de_AT', () => {
			expect(Textdomain.locale).toEqual('de_AT');
		});
	});

	describe('tests', () => {
		it('should select no context', () => {
			expect(
				gtx._x('The colors are {color1}, {color2}, and {color3}.', {
					color1: gtx._('red'),
					color2: gtx._('green'),
					color3: gtx._('blue'),
				}),
			).toEqual('Die Farben sind Rot, Grün und Blau.');
		});

		it("should select the 'colon' context", () => {
			expect(
				gtx._px('colon', 'The colors are {color1}, {color2}, and {color3}.', {
					color1: gtx._('red'),
					color2: gtx._('green'),
					color3: gtx._('blue'),
				}),
			).toEqual('Die Farben sind: Rot, Grün und Blau.');
		});

		it('should use the original string for unknown contexts', () => {
			expect(
				gtx._px(
					'gips.net',
					'The colors are {color1}, {color2}, and {color3}.',
					{
						color1: gtx._('red'),
						color2: gtx._('green'),
						color3: gtx._('blue'),
					},
				),
			).toEqual('The colors are Rot, Grün, and Blau.');
		});

		it('should work without placeholders', () => {
			expect(
				gtx._px('gips.net', 'The colors are {color1}, {color2}, and {color3}.'),
			).toEqual('The colors are {color1}, {color2}, and {color3}.');
		});
	});
});

describe('_np() (with context and placeholders)', () => {
	const gtx = Textdomain.getInstance('existing');
	gtx.bindtextdomain(localeDir);

	beforeAll(() => {
		Textdomain.locale = 'de_AT';
		return gtx.resolve();
	});

	describe('locale should be de_AT indeed', () => {
		it('should use the locale de_AT', () => {
			expect(Textdomain.locale).toEqual('de_AT');
		});
	});

	describe('tests', () => {
		it('should select the singular without context', () => {
			expect(gtx._n('Singular', 'Plural', 1)).toEqual('Einzahl');
		});
		it('should select the plural without context', () => {
			expect(gtx._n('Singular', 'Plural', 2)).toEqual('Mehrzahl');
		});
		it('should select the singular with context', () => {
			expect(gtx._np('Context here (2)', 'Singular', 'Plural', 1)).toEqual(
				'Einzahl 2',
			);
		});
		it('should select the plural with context', () => {
			expect(gtx._np('Context here (2)', 'Singular', 'Plural', 2)).toEqual(
				'Mehrzahl 2',
			);
		});
		it('should select the singular with unknown context', () => {
			expect(gtx._np('gips.net', 'Singular', 'Plural', 1)).toEqual('Singular');
		});
		it('should select the plural with unknown context', () => {
			expect(gtx._np('gips.net', 'Singular', 'Plural', 2)).toEqual('Plural');
		});
	});
});

describe('_npx() (with plural, context and placeholders)', () => {
	const gtx = Textdomain.getInstance('existing');
	gtx.bindtextdomain(localeDir);

	beforeAll(() => {
		Textdomain.locale = 'de_AT';
		return gtx.resolve();
	});

	describe('locale should be de_AT indeed', () => {
		it('should use the locale de_AT', () => {
			expect(Textdomain.locale).toEqual('de_AT');
		});
	});

	describe('tests', () => {
		it('should select no context and the singular', () => {
			expect(
				gtx._nx(
					'One directory has been deleted.',
					'{num} directories have been deleted.',
					1,
					{ num: 1 },
				),
			).toEqual('Ein Verzeichnis wurde gelöscht.');
		});
		it('should select no context and the plural', () => {
			expect(
				gtx._nx(
					'One directory has been deleted.',
					'{num} directories have been deleted.',
					2304,
					{ num: 2304 },
				),
			).toEqual('2304 Verzeichnisse wurden gelöscht.');
		});
		it('should select windows context and the singular', () => {
			expect(
				gtx._npx(
					'Windows',
					'One directory has been deleted.',
					'{num} directories have been deleted.',
					1,
					{ num: 1 },
				),
			).toEqual('Ein Ordner wurde gelöscht.');
		});
		it('should select windows context and the plural', () => {
			expect(
				gtx._npx(
					'Windows',
					'One directory has been deleted.',
					'{num} directories have been deleted.',
					2304,
					{ num: 2304 },
				),
			).toEqual('2304 Ordner wurden gelöscht.');
		});
		it('should select unknown context and the singular', () => {
			expect(
				gtx._npx(
					'Linux',
					'One directory has been deleted.',
					'{num} directories have been deleted.',
					1,
					{ num: 1 },
				),
			).toEqual('One directory has been deleted.');
		});
		it('should select unknown context and the plural', () => {
			expect(
				gtx._npx(
					'Linux',
					'One directory has been deleted.',
					'{num} directories have been deleted.',
					2304,
					{ num: 2304 },
				),
			).toEqual('2304 directories have been deleted.');
		});
		it('should work without placeholders', () => {
			expect(
				gtx._npx(
					'Linux',
					'One directory has been deleted.',
					'{num} directories have been deleted.',
					2304,
				),
			).toEqual('{num} directories have been deleted.');
		});
	});
});

describe('_l methods with fixed locale', () => {
	const gtx = Textdomain.getInstance('existing');
	gtx.bindtextdomain(localeDir);

	beforeAll(() => {
		return gtx.resolve('de');
	});

	describe('tests', () => {
		describe('_l', () => {
			it('should translate "January"', () => {
				expect(gtx._l('de', 'January')).toEqual('Januar');
			});
			it('should expand all placeholders', () => {
				expect(
					gtx._lx('de', 'The colors are {color1}, {color2}, and {color3}.', {
						color1: gtx._('red'),
						color2: gtx._('green'),
						color3: gtx._('blue'),
					}),
				).toEqual('Die Farben sind Rot, Grün und Blau.');
			});
		});
	});
});

describe('no-op methods', () => {
	const gtx = Textdomain.getInstance('test');
	gtx.bindtextdomain(localeDir);

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
		it('the class method should return the expanded msgid', () => {
			expect(Textdomain.N_x('age: {age}', { age: 7 })).toEqual('age: 7');
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

	describe('N_px()', () => {
		it('the instance method should return the expanded msgid', () => {
			expect(gtx.N_px('whatever', 'age: {age}', { age: 7 })).toEqual('age: 7');
		});
		it('the class method should return the expanded msgid', () => {
			expect(Textdomain.N_px('whatever', 'age: {age}', { age: 7 })).toEqual(
				'age: 7',
			);
		});
	});
});

describe('plural inconsistencies', () => {
	const catalog: Catalog = {
		major: 0,
		minor: 0,
		pluralFunction: () => 42,
		entries: {
			one: ['yksi'],
			two: ['yksi', 'kaksi'],
		},
	};

	it('should pick the only translation', () => {
		const trans = gettextImpl({
			catalog,
			msgid: 'one',
			msgidPlural: 'two',
			numItems: 1,
		});
		expect(trans).toEqual('yksi');
	});

	it('should use germanic plural', () => {
		const trans = gettextImpl({
			catalog,
			msgid: 'two',
			msgidPlural: 'twos',
			numItems: 2,
		});
		expect(trans).toEqual('kaksi');
	});
});
