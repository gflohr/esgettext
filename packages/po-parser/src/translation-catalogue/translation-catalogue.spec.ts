import { TranslationCatalogue } from './translation-catalogue';
import { PoEntry } from './po-entry';

const date = '2020-04-23 08:50+0300';

describe('translation catalogue', () => {
	describe('initialization', () => {
		it('should be initialized with zero configuration', () => {
			const catalogue = new TranslationCatalogue();
			expect(catalogue.renderPo({ width: 76 })).toMatch(/Content-Type/);
		});

		it('should be initialized with default values', () => {
			const catalogue = new TranslationCatalogue({ date });
			expect(catalogue.renderPo()).toMatchSnapshot();
		});

		it('should honour the foreign-user option', () => {
			const catalogue = new TranslationCatalogue({ date, foreignUser: true });
			expect(catalogue.renderPo()).toMatchSnapshot();
		});

		it('should honour the package option', () => {
			const catalogue = new TranslationCatalogue({ date, package: 'foobar 23.4' });
			expect(catalogue.renderPo()).toMatchSnapshot();
		});

		it('should ignore a lone version option', () => {
			const catalogue = new TranslationCatalogue({ date, version: '23.4' });
			expect(catalogue.renderPo()).toMatchSnapshot();
		});

		it('should honour the version option', () => {
			const catalogue = new TranslationCatalogue({
				date,
				package: 'foobar',
				version: '23.4.89',
			});
			expect(catalogue.renderPo()).toMatchSnapshot();
		});

		it('should honour the msgid-bugs-address option', () => {
			const catalogue = new TranslationCatalogue({
				date,
				msgidBugsAddress: 'me@example.com',
			});
			expect(catalogue.renderPo()).toMatchSnapshot();
		});
	});

	describe('conflicting flags', () => {
		/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
		let warner: jest.SpyInstance<void, [any?, ...any[]]>;

		beforeEach(() => {
			warner = jest.spyOn(global.console, 'warn').mockImplementation(() => {
				/* ignore */
			});
		});

		afterEach(() => jest.restoreAllMocks());

		it('should warn about conflicting flags', () => {
			const catalogue = new TranslationCatalogue();

			catalogue.addEntry(
				new PoEntry({
					msgid: 'hello',
					flags: ['no-mercy', 'perl-brace-format'],
					references: ['first.js:10'],
				}),
			);

			catalogue.addEntry(
				new PoEntry({
					msgid: 'hello',
					flags: ['no-mercy'],
					references: ['second.js:10'],
				}),
			);

			catalogue.addEntry(
				new PoEntry({
					msgid: 'hello',
					flags: ['mercy'],
					references: ['third.js:10'],
				}),
			);
			expect(warner).toHaveBeenCalledTimes(4);

			catalogue.addEntry(
				new PoEntry({
					msgid: 'hello',
					flags: ['no-perl-brace-format'],
					references: ['third.js:10'],
				}),
			);
			expect(warner).toHaveBeenCalledTimes(9);
		});
	});

	describe('continuous filling', () => {
		const catalogue = new TranslationCatalogue({ date });

		it('should add an entry', () => {
			catalogue.addEntry(
				new PoEntry({
					msgid: 'Mike',
					references: ['src/zulu.ts:2304'],
				}),
			);
			expect(catalogue.renderPo()).toMatchSnapshot();
		});

		it('should add a second entry', () => {
			catalogue.addEntry(
				new PoEntry({
					msgid: 'November',
					references: ['src/yankee.ts:42'],
				}),
			);
			expect(catalogue.renderPo()).toMatchSnapshot();
		});

		it('should merge the third entry', () => {
			catalogue.addEntry(
				new PoEntry({
					msgid: 'Mike',
					references: ['src/xray.ts:1303'],
				}),
			);
			expect(catalogue.renderPo()).toMatchSnapshot();
		});

		// This can later be used to test sorting by file.
		it('should support a string at many locations', () => {
			catalogue.addEntry(
				new PoEntry({
					msgid: 'Lima',
					references: ['whiskey.ts:2'],
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'Oscar',
					references: ['whiskey.ts:2'],
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'Lima',
					references: ['victor.ts:3'],
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'Oscar',
					references: ['victor.ts:3'],
				}),
			);
			// When sorting by file, the Oscar entry should appear before
			// the Lima entry. Actually that case could not happen but ...
			catalogue.addEntry(
				new PoEntry({
					msgid: 'Lima',
					references: ['uniform.ts:4'],
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'Oscar',
					references: ['uniform.ts:3'],
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'Lima',
					references: ['tango.ts:25'],
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'Oscar',
					references: ['tango.ts:25'],
				}),
			);
			expect(catalogue.renderPo()).toMatchSnapshot();
		});
		it('should also merge flags and comments', () => {
			catalogue.addEntry(
				new PoEntry({
					msgid: 'Mike',
					translatorComments: ['This is difficult.'],
					automatic: ['TRANSLATORS: Buy me a milk shake!'],
					flags: ['no-c-format'],
					references: ['sierra.ts:27'],
				}),
			);
			expect(catalogue.renderPo()).toMatchSnapshot();

			catalogue.addEntry(
				new PoEntry({
					msgid: 'Mike',
					translatorComments: ['Not really.'],
					automatic: ['TRANSLATORS: Drop me a line!'],
					flags: ['perl-brace-format'],
					references: ['romeo.ts:85'],
				}),
			);
			expect(catalogue.renderPo()).toMatchSnapshot();

			// We need entries with a message context.
			catalogue.addEntry(
				new PoEntry({
					msgid: 'Mike',
					msgctxt: 'phonetic alphabet',
					references: ['juliet.ts:85'],
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'Mike',
					msgctxt: 'audio',
					references: ['golf.ts:85'],
				}),
			);

			// And entries with one more ref than another.
			catalogue.addEntry(
				new PoEntry({
					msgid: 'Foxtrot',
					references: ['src/yankee.ts:42', 'src/zulu.ts:2304'],
				}),
			);
		});

		it('should sort output on demand', () => {
			expect(catalogue.renderPo({ sortOutput: true })).toMatchSnapshot();
		});

		it('should sort by file on demand', () => {
			expect(catalogue.renderPo({ sortByFile: true })).toMatchSnapshot();
		});
	});

	describe('deleting', () => {
		const catalogue = new TranslationCatalogue({ date });

		catalogue.addEntry(
			new PoEntry({
				msgid: 'Hello, world!',
			}),
		);

		expect(catalogue.renderPo()).toMatchSnapshot();

		catalogue.deleteEntry('Hello, world!');
		catalogue.deleteEntry('Goodbye, world!');
		catalogue.deleteEntry('Hello, world!', 'La-la-land');

		expect(catalogue.renderPo()).toMatchSnapshot();

		catalogue.deleteEntry('');
		expect(catalogue.renderPo()).toEqual('');
	});

	describe('sorting', () => {
		it('should sort by msgctxt', () => {
			const catalogue = new TranslationCatalogue({ date });

			catalogue.addEntry(
				new PoEntry({
					msgid: 'sort',
					msgctxt: 'delta',
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'sort',
					msgctxt: 'charlie',
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'sort',
					msgctxt: 'bravo',
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'sort',
					msgctxt: 'alpha',
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'sort',
				}),
			);

			expect(catalogue.renderPo({ sortOutput: true })).toMatchSnapshot();
		});

		it('should sort by line number', () => {
			const catalogue = new TranslationCatalogue({ date });

			catalogue.addEntry(
				new PoEntry({
					msgid: 'alpha',
					references: ['source.ts:42'],
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'bravo',
					references: ['source.ts:3'],
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'charlie',
					references: ['source.ts:31'],
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'delta',
					references: ['source.ts:1'],
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'echo',
					references: ['source.ts:11', 'source.ts:13'],
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'foxtrot',
					references: ['source.ts:11', 'source.ts:12'],
				}),
			);
			catalogue.addEntry(
				new PoEntry({
					msgid: 'golf',
				}),
			);

			expect(catalogue.renderPo({ sortByFile: true })).toMatchSnapshot();
		});
	});
});
